import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { Brackets, Repository } from 'typeorm';
import { StoreCategoriesValidation } from './validation/store_categories.validation.dto';
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
    const createStocat: Partial<StoreCategoriesDocument> = {
      // name_id: data.name_id,
      // name_en: data.name_en,
    };
    try {
      const url = await this.storage.store(data.image);
      createStocat.image = url;
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(e.message);
    }
    if (typeof data.active != 'undefined') {
      // createStocat.active = Boolean(data.active).valueOf();
      if (data.active == 'true') createStocat.active = true;
      if (data.active == 'false') createStocat.active = false;
    }
    return await this.storeCategoriesRepository
      .save(createStocat)
      .then(async (result) => {
        const manipulateRow: Record<string, any> = result;
        const keys = [];
        for (const k in data) keys.push(k);
        keys.forEach(async (key) => {
          if (key.substring(0, 5) == 'name_') {
            manipulateRow[key] = data[key];
            await this.languageRepository.save({
              key: 'store_category',
              key_id: result.id,
              lang: key.substring(5),
              name: data[key],
            });
          }
        });
        dbOutputTime(manipulateRow);

        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          manipulateRow,
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
      await this.storeCategoriesRepository.findOne(data.id).catch(() => {
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
      const errors: RMessage = {
        value: data.id,
        property: 'id',
        constraint: [this.messageService.get('merchant.general.idNotFound')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
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

    const langExist = await this.languageRepository
      .find({ where: { key_id: stoCatExist.id } })
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
    // const manipulateRow: Record<string, any> = result;
    const keys = [];
    for (const k in data) keys.push(k);
    keys.forEach(async (key) => {
      if (key.substring(0, 5) == 'name_') {
        const updateLang: Partial<LanguageDocument> = {
          key: 'store_category',
          key_id: stoCatExist.id,
          lang: key.substring(5),
          name: data[key],
        };
        const idx = _.findIndex(langExist, function (ix: any) {
          console.log('langExist lang: ', ix.lang);
          console.log('key_id: ', key.substring(5));
          return ix.lang == key.substring(5);
        });
        if (idx != -1) {
          updateLang.id = langExist[idx].id;
        }
        console.log('updatelang: ', updateLang);
        await this.languageRepository.save(updateLang).catch(() => {
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
      }
    });

    // if (
    //   data.name_id != null &&
    //   data.name_id != '' &&
    //   typeof data.name_id != 'undefined'
    // )
    //   if (
    //     data.name_en != null &&
    //     data.name_en != '' &&
    //     typeof data.name_en != 'undefined'
    //   )
    if (typeof data.active != 'undefined') {
      // stoCatExist.name_id = data.name_id;
      // stoCatExist.name_en = data.name_en;
      // stoCatExist.active = Boolean(data.active).valueOf();
      if (data.active == 'true') stoCatExist.active = true;
      if (data.active == 'false') stoCatExist.active = false;
    }

    return await this.storeCategoriesRepository
      .save(stoCatExist)
      .then(async (result) => {
        dbOutputTime(result);
        const manipulateRow: Record<string, any> = result;
        const reUpdateLang = await this.languageRepository
          .find({ where: { key_id: result.id } })
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
        console.log('reupdatelang: ', reUpdateLang);
        reUpdateLang.forEach((row) => {
          manipulateRow['name_' + row.lang] = row.name;
        });
        keys.forEach(async (key) => {
          if (typeof manipulateRow[key] == 'undefined')
            manipulateRow[key] = data[key];
        });
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          manipulateRow,
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
    const deleteStoreCategories: Partial<StoreCategoriesDocument> = {
      id: data,
    };
    return this.storeCategoriesRepository
      .softDelete(deleteStoreCategories)
      .then(async () => {
        const delLang: Partial<LanguageDocument> = {
          key: 'store_category',
          key_id: data,
        };
        await this.languageRepository.softDelete(delLang);
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
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    // const active = data.active || true;
    let totalItems: number;

    return await this.storeCategoriesRepository
      .createQueryBuilder()
      .where(
        new Brackets((qb) => {
          qb.where('lower(name_id) like :mname', {
            mname: '%' + search + '%',
          });
          qb.orWhere('lower(name_en) like :sname', {
            sname: '%' + search + '%',
          });
        }),
      )
      // .andWhere('active = :active', { active: active })
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.storeCategoriesRepository
          .createQueryBuilder()
          .where(
            new Brackets((qb) => {
              qb.where('lower(name_id) like :mname', {
                mname: '%' + search + '%',
              });
              qb.orWhere('lower(name_en) like :sname', {
                sname: '%' + search + '%',
              });
            }),
          )
          // .andWhere('active = :active', { active: active })
          .orderBy('name_id')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getMany();
      })
      .then((result) => {
        result.forEach((raw) => {
          dbOutputTime(raw);
        });

        const listResult: ListResponse = {
          total_item: totalItems,
          limit: Number(perPage),
          current_page: Number(currentPage),
          items: result,
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
              code: 'DB_ERROR',
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
      });
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
