import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime, formatingAllOutputTime } from 'src/utils/general-utils';
import { Brackets, FindOperator, ILike, Not, Repository } from 'typeorm';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeValidation } from './validation/price_range.validation';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';

@Injectable()
export class PriceRangeService {
  constructor(
    @InjectRepository(PriceRangeDocument)
    private readonly priceRangeRepository: Repository<PriceRangeDocument>,
    @InjectRepository(PriceRangeLanguageDocument)
    private readonly priceRangeLanguageRepository: Repository<PriceRangeLanguageDocument>,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  async createPriceRange(
    args: PriceRangeValidation,
  ): Promise<PriceRangeDocument> {
    await this.validateUniqueName(args.name);
    const languages = await this.validateUniqueLanguageName(args.languages);
    const createPriceRange = { ...args };
    createPriceRange.languages = [];

    try {
      const createResult = await this.priceRangeRepository.save(
        createPriceRange,
      );

      await Promise.all(
        languages.map(async (langData) => {
          const createLang: Partial<PriceRangeLanguageDocument> = langData;
          createLang.price_range_id = createResult.id;
          const createLangResult = await this.priceRangeLanguageRepository.save(
            createLang,
          );
          createResult.languages.push(createLangResult);
        }),
      );
      formatingAllOutputTime(createResult);
      return createResult;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.createFail'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async findPricesByIds(
    ids: string[],
    sort?: 'ASC',
  ): Promise<PriceRangeDocument[]> {
    return this.priceRangeRepository.findByIds(ids, {
      order: { sequence: sort },
    });
  }

  async updatePriceRange(
    args: Partial<PriceRangeValidation>,
  ): Promise<PriceRangeDocument> {
    await this.validateUniqueName(args.name, args.id);
    const languages = await this.validateUniqueLanguageName(
      args.languages,
      args.id,
    );
    const priceRange = await this.getAndValidatePriceRangeById(args.id);
    Object.assign(priceRange, args);

    try {
      await this.priceRangeLanguageRepository.softDelete({
        price_range_id: priceRange.id,
      });
      priceRange.languages = [];

      await Promise.all(
        languages.map(async (langData) => {
          const createLang: Partial<PriceRangeLanguageDocument> = langData;
          createLang.price_range_id = priceRange.id;
          const createLangResult = await this.priceRangeLanguageRepository.save(
            createLang,
          );
          priceRange.languages.push(createLangResult);
        }),
      );

      await this.priceRangeRepository.save(priceRange);

      formatingAllOutputTime(priceRange);
      return priceRange;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.updateFail'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async deletePriceRange(priceRangeId: string): Promise<PriceRangeDocument> {
    const priceRangeExist = await this.getAndValidatePriceRangeById(
      priceRangeId,
    );

    try {
      const deletePriceRange = await this.priceRangeRepository.softRemove(
        priceRangeExist,
      );
      return deletePriceRange;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: priceRangeId,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.deleteFail'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async listPriceRange(
    args: Partial<PriceRangeValidation>,
  ): Promise<RSuccessMessage> {
    const search = args.search || '';
    const currentPage = Number(args.page) || 1;
    const perPage = Number(args.limit) || 10;
    let totalItems: number;

    return await this.priceRangeRepository
      .createQueryBuilder('price_range')
      .leftJoinAndSelect('price_range.languages', 'languages')
      .where(
        new Brackets((qb) => {
          qb.where('price_range.name ilike :mname', {
            mname: '%' + search + '%',
          }).orWhere('price_range.symbol ilike :ssymbol', {
            ssymbol: '%' + search + '%',
          });
        }),
      )
      .orderBy('price_range.sequence')
      .skip((currentPage - 1) * perPage)
      .take(perPage)
      .getManyAndCount()
      .then(async (result) => {
        totalItems = result[1];
        result[0].forEach((raw) => {
          dbOutputTime(raw);
        });

        const listResult: ListResponse = {
          total_item: totalItems,
          limit: perPage,
          current_page: currentPage,
          items: result[0],
        };
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          listResult,
        );
      })
      .catch((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'id',
              constraint: [
                this.messageService.getjson({
                  code: 'DATA_NOT_FOUND',
                  message: err.message,
                }),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }

  async getPriceRangeByPrice(price: number) {
    try {
      return this.priceRangeRepository
        .createQueryBuilder('pr')
        .leftJoinAndSelect('pr.languages', 'languages')
        .where('pr.price_high >= :price AND pr.price_low <= :price', {
          price,
        })
        .orWhere('pr.price_low <= :price AND pr.price_high = 0', { price })
        .getOne();
    } catch (error) {
      throw new Error(error);
    }
  }

  async getPriceRange(): Promise<PriceRangeDocument[]> {
    try {
      return this.priceRangeRepository
        .createQueryBuilder('pr')
        .leftJoinAndSelect('pr.languages', 'languages')
        .getMany();
    } catch (error) {
      throw new Error(error);
    }
  }

  async viewDetailPriceRange(
    priceRangeId: string,
  ): Promise<PriceRangeDocument> {
    const result = await this.priceRangeRepository
      .findOne(priceRangeId, { relations: ['languages'] })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: priceRangeId,
              property: 'price_range_id',
              constraint: [
                this.messageService.get('merchant.general.dataNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });

    dbOutputTime(result);
    return result;
  }

  //------------------------------------------------------------------------------

  async validateUniqueLanguageName(
    languages: PriceRangeLanguageDocument[],
    priceRangeId?: string,
  ): Promise<{ lang: string; name: string }[]> {
    const query = this.priceRangeLanguageRepository.createQueryBuilder(
      'price_range_language',
    );

    const queryWhere = [];
    for (let i = 0; i < languages.length; i++) {
      queryWhere.push(
        `( price_range_language.lang = '${languages[i].lang}' AND price_range_language.name = '${languages[i].name}' )`,
      );
    }
    query.where(
      new Brackets((qb) => {
        qb.where(queryWhere.join(' OR '));
      }),
    );
    if (priceRangeId) {
      query.andWhere('price_range_language.price_range_id != :price_range_id', {
        price_range_id: priceRangeId,
      });
    }

    const priceRangeLanguage = await query.getOne();
    if (priceRangeLanguage) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: priceRangeLanguage.name,
            property: 'name',
            constraint: [this.messageService.get('merchant.general.nameExist')],
          },
          'Bad Request',
        ),
      );
    }
    return languages;
  }

  async validateUniqueName(
    name: string,
    priceRangeId?: string,
  ): Promise<PriceRangeDocument> {
    const where: { name: FindOperator<string>; id?: FindOperator<string> } = {
      name: ILike(name),
    };
    if (priceRangeId) {
      where.id = Not(priceRangeId);
    }
    const priceRange = await this.priceRangeRepository.findOne({
      where,
    });

    if (priceRange) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: priceRange.name,
            property: 'name',
            constraint: [this.messageService.get('merchant.general.nameExist')],
          },
          'Bad Request',
        ),
      );
    }
    return priceRange;
  }

  async getAndValidatePriceRangeById(
    priceRangeId: string,
  ): Promise<PriceRangeDocument> {
    const priceRange = await this.priceRangeRepository.findOne({
      where: { id: priceRangeId },
      relations: ['languages'],
    });
    if (!priceRange) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: priceRangeId,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    return priceRange;
  }
}
