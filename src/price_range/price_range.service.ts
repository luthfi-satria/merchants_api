import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeValidation } from './validation/price_range.validation';
import { isNumber } from 'class-validator';

@Injectable()
export class PriceRangeService {
  constructor(
    @InjectRepository(PriceRangeDocument)
    private readonly priceRangeRepository: Repository<PriceRangeDocument>,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  async createPriceRange(
    args: Partial<PriceRangeValidation>,
  ): Promise<RSuccessMessage> {
    const validArgs = await this.extendValidationCreate(args);
    const createPriceRange: Partial<PriceRangeDocument> = {
      name: validArgs.name,
      symbol: args.symbol,
      price_low: validArgs.price_low,
      price_high: validArgs.price_high,
      sequence: validArgs.sequence,
    };

    return await this.priceRangeRepository
      .save(createPriceRange)
      .then((result) => {
        dbOutputTime(result);

        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          result,
        );
      })
      .catch((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: err.column,
              constraint: [err.message],
            },
            'Bad Request',
          ),
        );
      });
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
  ): Promise<RSuccessMessage> {
    const priceRangeExist = await this.extendValidationId(args);
    const validArgs = await this.extendValidationUpdate(priceRangeExist, args);

    return await this.priceRangeRepository
      .save(validArgs)
      .then(async (result) => {
        dbOutputTime(result);

        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          result,
        );
      })
      .catch((err) => {
        console.error('catch error: ', err);
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: err.column,
              constraint: [err.message],
            },
            'Bad Request',
          ),
        );
      });
  }

  async deletePriceRange(
    args: Partial<PriceRangeValidation>,
  ): Promise<RSuccessMessage> {
    const priceRangeExist = await this.extendValidationId(args);

    return this.priceRangeRepository
      .softDelete({ id: priceRangeExist.id })
      .then(async () => {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
        );
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.general.invalidID'),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }

  async listPriceRange(
    args: Partial<PriceRangeValidation>,
  ): Promise<RSuccessMessage> {
    const search = args.search || '';
    const currentPage = Number(args.page) || 1;
    const perPage = Number(args.limit) || 10;
    let totalItems: number;

    return await this.priceRangeRepository
      .createQueryBuilder('')
      .where(
        new Brackets((qb) => {
          qb.where('name ilike :mname', {
            mname: '%' + search + '%',
          }).orWhere('symbol ilike :ssymbol', {
            ssymbol: '%' + search + '%',
          });
        }),
      )
      .orderBy('sequence')
      .offset((currentPage - 1) * perPage)
      .limit(perPage)
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
        .where('pr.price_high >= :price AND pr.price_low <= :price', {
          price,
        })
        .orWhere('pr.price_low <= :price AND pr.price_high = 0', { price })
        .getOne();
    } catch (error) {
      throw new Error(error);
    }
  }

  //------------------------------------------------------------------------------

  async extendValidationCreate(
    args: Partial<PriceRangeValidation>,
  ): Promise<Partial<PriceRangeValidation>> {
    if (typeof args.name != 'undefined' && args.name != '') {
      const cekPriceRange = await this.priceRangeRepository
        .findOne({
          where: { name: args.name },
        })
        .catch((err) => {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: '',
                property: err.column,
                constraint: [err.message],
              },
              'Bad Request',
            ),
          );
        });
      if (cekPriceRange) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.name,
              property: 'name',
              constraint: [
                this.messageService.get('merchant.general.nameExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    if (typeof args.price_low != 'undefined' && args.price_low != null) {
      if (!isNumber(args.price_low)) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: String(args.price_low),
              property: 'price_low',
              constraint: [
                this.messageService.get('merchant.general.invalidValue'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    if (typeof args.price_high != 'undefined' && args.price_high != null) {
      if (!isNumber(args.price_high)) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: String(args.price_low),
              property: 'price_low',
              constraint: [
                this.messageService.get('merchant.general.invalidValue'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    if (!isNumber(args.sequence)) {
      args.sequence = null;
    }
    return args;
  }

  async extendValidationUpdate(
    priceRangeExist: PriceRangeDocument,
    args: Partial<PriceRangeValidation>,
  ): Promise<PriceRangeDocument> {
    if (typeof args.name != 'undefined' && args.name != '') {
      const cekPriceRange = await this.priceRangeRepository
        .findOne({
          where: { name: args.name },
        })
        .catch((err) => {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: '',
                property: err.column,
                constraint: [err.message],
              },
              'Bad Request',
            ),
          );
        });
      if (cekPriceRange && cekPriceRange.id != args.id) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.name,
              property: 'name',
              constraint: [
                this.messageService.get('merchant.general.nameExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      priceRangeExist.name = args.name;
    }

    if (typeof args.symbol != 'undefined' && args.symbol != null) {
      priceRangeExist.symbol = args.symbol;
    }
    if (typeof args.price_low != 'undefined' && args.price_low != null) {
      if (!isNumber(args.price_low)) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: String(args.price_low),
              property: 'price_low',
              constraint: [
                this.messageService.get('merchant.general.invalidValue'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      priceRangeExist.price_low = args.price_low;
    }

    if (typeof args.price_high != 'undefined' && args.price_high != null) {
      if (!isNumber(args.price_high)) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: String(args.price_low),
              property: 'price_low',
              constraint: [
                this.messageService.get('merchant.general.invalidValue'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      priceRangeExist.price_high = args.price_high;
    }

    if (!isNumber(args.sequence)) {
      delete args.sequence;
    } else {
      priceRangeExist.sequence = args.sequence;
    }

    return priceRangeExist;
  }

  async extendValidationId(
    args: Partial<PriceRangeValidation>,
  ): Promise<PriceRangeDocument> {
    const priceRangeExist: PriceRangeDocument = await this.priceRangeRepository
      .findOne({
        where: { id: args.id },
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!priceRangeExist) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    return priceRangeExist;
  }
}
