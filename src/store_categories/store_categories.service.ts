import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { In, Repository } from 'typeorm';
import {
  StoreCategoriesValidation,
  StoreCategoryStatus,
} from './validation/store_categories.validation.dto';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { LanguageDocument } from 'src/database/entities/language.entity';
import _ from 'lodash';

@Injectable()
export class StoreCategoriesService {
  constructor(
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoriesRepository: Repository<StoreCategoriesDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private httpService: HttpService,
    private readonly storage: CommonStorageService,
    @InjectRepository(LanguageDocument)
    private readonly languageRepository: Repository<LanguageDocument>,
  ) {}

  async createStoreCategories(
    data: Partial<StoreCategoriesValidation>,
  ): Promise<RSuccessMessage> {
    const createStocat: Partial<StoreCategoriesDocument> = {};
    try {
      const url = await this.storage.store(data.image);
      createStocat.image = url;
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(e.message);
    }
    if (data.sequence != null && typeof data.sequence != 'undefined') {
      createStocat.sequence = data.sequence;
    }
    if (typeof data.active != 'undefined') {
      if (data.active == 'true') createStocat.active = true;
      if (data.active == 'false') createStocat.active = false;
    }

    const keys = [];
    for (const k in data) keys.push(k);
    createStocat.languages = [];
    for (const key of keys) {
      if (key.substring(0, 5) == 'name_') {
        await this.languageRepository
          .save({
            lang: key.substring(5),
            name: data[key],
          })
          .then((result) => {
            createStocat.languages.push(result);
          })
          .catch((err) => {
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: data[key],
                  property: key,
                  constraint: [err.message],
                },
                'Bad Request',
              ),
            );
          });
      }
    }

    return await this.storeCategoriesRepository
      .save(createStocat)
      .then(async (result) => {
        dbOutputTime(result);
        result.languages.forEach((row) => {
          dbOutputTime(row);
        });

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

  async updateStoreCategories(
    data: Partial<StoreCategoriesValidation>,
  ): Promise<RSuccessMessage> {
    const stoCatExist: StoreCategoriesDocument =
      await this.storeCategoriesRepository
        .findOne({
          where: { id: data.id },
          relations: ['languages'],
        })
        .catch(() => {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: data.id,
                property: 'id',
                constraint: [
                  this.messageService.get('merchant.general.idNotFound'),
                ],
              },
              'Bad Request',
            ),
          );
        });
    if (!stoCatExist) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: data.id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    if (
      data.image != null &&
      data.image != '' &&
      typeof data.image != 'undefined'
    ) {
      try {
        const url = await this.storage.store(data.image);
        stoCatExist.image = url;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }

    // const manipulateRow: Record<string, any> = result;
    const keys = [];
    for (const k in data) keys.push(k);
    for (const key of keys) {
      if (key.substring(0, 5) == 'name_') {
        const updateLang: Partial<LanguageDocument> = {
          lang: key.substring(5),
          name: data[key],
        };
        const idx = _.findIndex(stoCatExist.languages, function (ix: any) {
          return ix.lang == key.substring(5);
        });
        if (idx != -1) {
          // updateLang.id = stoCatExist.languages[idx].id;
          stoCatExist.languages[idx].lang = key.substring(5);
          stoCatExist.languages[idx].name = data[key];
        } else {
          const addStocat = await this.languageRepository
            .save(updateLang)
            .catch(() => {
              throw new BadRequestException(
                this.responseService.error(
                  HttpStatus.BAD_REQUEST,
                  {
                    value: data[key],
                    property: key,
                    constraint: [
                      this.messageService.get('merchant.general.idNotFound'),
                    ],
                  },
                  'Bad Request',
                ),
              );
            });
          stoCatExist.languages.push(addStocat);
        }
      }
    }

    if (typeof data.active != 'undefined') {
      if (data.active == 'true') stoCatExist.active = true;
      if (data.active == 'false') stoCatExist.active = false;
    }
    if (data.sequence != null && typeof data.sequence != 'undefined') {
      stoCatExist.sequence = +data.sequence;
    }

    return await this.storeCategoriesRepository
      .save(stoCatExist)
      .then(async (result) => {
        dbOutputTime(result);
        result.languages.forEach((row) => {
          dbOutputTime(row);
        });

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
              property: '',
              constraint: [err.routine],
            },
            'Bad Request',
          ),
        );
      });
  }

  async deleteStoreCategories(data: string): Promise<RSuccessMessage> {
    const getStocat = await this.storeCategoriesRepository
      .findOne({
        where: { id: data },
        relations: ['languages'],
      })
      .catch(() => {
        const errors: RMessage = {
          value: data,
          property: 'id',
          constraint: [this.messageService.get('merchant.general.invalidID')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
    return this.storeCategoriesRepository
      .softDelete({ id: data })
      .then(async () => {
        if (getStocat.languages.length > 0) {
          for (const row of getStocat.languages) {
            await this.languageRepository.softDelete({ id: row.id });
          }
        }
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
        );
      })
      .catch(() => {
        const errors: RMessage = {
          value: data,
          property: 'id',
          constraint: [this.messageService.get('merchant.general.invalidID')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async listStoreCategories(
    data: Partial<StoreCategoriesValidation>,
  ): Promise<RSuccessMessage> {
    // let search = data.search || '';
    // search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    // let totalItems;
    const actives = [];

    if (data.active == 'true') actives.push(true);
    if (data.active == 'false') actives.push(false);
    if (data.statuses && data.statuses.length > 0) {
      for (const status of data.statuses) {
        if (status == StoreCategoryStatus.ACTIVE) actives.push(true);
        if (status == StoreCategoryStatus.INACTIVE) actives.push(false);
      }
    }
    console.log('actives: ', actives);
    const qCount = this.storeCategoriesRepository.createQueryBuilder('sc');

    if (actives.length > 0) {
      qCount.andWhere('sc.active in (:...actives)', {
        actives: actives,
      });
    }

    qCount
      // .andWhere('sc.active = true')
      .orderBy('sc.sequence')
      .offset((currentPage - 1) * perPage)
      .limit(perPage);

    const storeCategories = await qCount.getManyAndCount();
    console.log('storeCategories: ', storeCategories);
    const listStocat = [];
    storeCategories[0].forEach((raw) => {
      listStocat.push(raw.id);
    });
    const totalItems = storeCategories[1];

    return (
      this.storeCategoriesRepository
        .createQueryBuilder('sc')
        .leftJoinAndSelect(
          'sc.languages',
          'merchant_store_categories_languages',
        )
        .where('sc.id IN(:...lid)', { lid: listStocat })
        .orderBy('sc.sequence')
        .getMany()
        // })
        .then((results) => {
          for (const result of results) {
            dbOutputTime(result);
            if (result.active) {
              result.status = StoreCategoryStatus.ACTIVE;
            } else if (!result.active) {
              result.status = StoreCategoryStatus.INACTIVE;
            }
          }

          const listResult: ListResponse = {
            total_item: totalItems,
            limit: Number(perPage),
            current_page: Number(currentPage),
            items: results,
          };
          return this.responseService.success(
            true,
            this.messageService.get('merchant.general.success'),
            listResult,
          );
        })
        .catch((err) => {
          const errors: RMessage = {
            value: '',
            property: '',
            constraint: [
              this.messageService.getjson({
                code: 'DATA_NOT_FOUND',
                message: err.message,
              }),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        })
    );
  }

  async viewDetailStoreCategory(
    store_catgory_id: string,
  ): Promise<RSuccessMessage> {
    const result = await this.storeCategoriesRepository.findOne({
      where: { active: true, id: store_catgory_id },
      relations: ['languages'],
    });
    if (!result) {
      const errors: RMessage = {
        value: store_catgory_id,
        property: 'store_category_id',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  async getStoreCategoryByIds(
    storeCatgoryIds: string[],
  ): Promise<StoreCategoriesDocument[]> {
    const result = await this.storeCategoriesRepository.find({
      where: { id: In(storeCatgoryIds) },
      relations: ['languages'],
    });
    if (!result) {
      const errors: RMessage = {
        value: storeCatgoryIds.join(','),
        property: 'store_category_id',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return result;
  }

  //------------------------------------------------------------------------------

  async getHttp(
    url: string,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.get(url, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
