import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { isDefined } from 'class-validator';
import _ from 'lodash';
import { catchError, map, Observable } from 'rxjs';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { In, Like, Repository } from 'typeorm';
import {
  StoreCategoriesValidation,
  StoreCategoryStatus,
} from './validation/store_categories.validation.dto';
import { SetFieldEmptyUtils } from '../utils/set-field-empty-utils';

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
      createStocat.image = await this.storage.store(data.image);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }

    if (data.sequence != null && typeof data.sequence != 'undefined') {
      createStocat.sequence = data.sequence;
    }

    if (typeof data.active != 'undefined') {
      if (data.active == 'true') createStocat.active = true;

      if (data.active == 'false') createStocat.active = false;
    }

    createStocat.languages = [];

    for (const key in data) {
      if (key.substring(0, 5) == 'name_') {
        createStocat.languages.push({
          lang: key.substring(5),
          name: data[key],
        });
      }
    }

    return await this.storeCategoriesRepository
      .save(createStocat)
      .then(async (result) => {
        dbOutputTime(result);
        if (
          isDefined(result.image) &&
          result.image &&
          !result.image.includes('dummyimage')
        ) {
          const fileNameImage =
            result.image.split('/')[result.image.split('/').length - 1];
          result.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${result.id}/image/${fileNameImage}`;
        }

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
    if (isDefined(data.image)) {
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
          await this.languageRepository.save(stoCatExist.languages[idx]);
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

    Object.assign(
      stoCatExist,
      new SetFieldEmptyUtils().apply(stoCatExist, data.delete_files),
    );

    return this.storeCategoriesRepository
      .save(stoCatExist)
      .then(async (result) => {
        dbOutputTime(result);
        if (
          isDefined(result.image) &&
          result.image &&
          !result.image.includes('dummyimage')
        ) {
          const fileNameImage =
            result.image.split('/')[result.image.split('/').length - 1];
          result.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${result.id}/image/${fileNameImage}`;
        }

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
    try {
      const search = data.search || '';
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;
      const actives = [];

      if (data.active == 'true') actives.push(true);
      if (data.active == 'false') actives.push(false);
      if (data.statuses && data.statuses.length > 0) {
        for (const status of data.statuses) {
          if (status == StoreCategoryStatus.ACTIVE) actives.push(true);
          if (status == StoreCategoryStatus.INACTIVE) actives.push(false);
        }
      }
      const qCount = this.storeCategoriesRepository
        .createQueryBuilder('sc')
        .leftJoinAndSelect('sc.languages', 'mscl');

      if (actives.length > 0) {
        qCount.andWhere('sc.active in (:...actives)', {
          actives: actives,
        });
      }
      if (data.search) {
        qCount.andWhere('mscl.name  ilike :sname', {
          sname: '%' + search + '%',
        });
      }

      qCount
        .orderBy('sc.sequence')
        .skip((currentPage - 1) * perPage)
        .take(perPage);

      const storeCategories = await qCount.getManyAndCount();
      const totalItems = storeCategories[1];
      console.log(storeCategories[0][0].languages);

      const categoryIds: string[] = [];
      await storeCategories[0].map((item) => categoryIds.push(item.id));

      const categories = await this.storeCategoriesRepository
        .createQueryBuilder('sc')
        .leftJoinAndSelect('sc.languages', 'mscl')
        .where('mscl.storeCategoriesId IN (:...categoryIds)', {
          categoryIds,
        })
        .orWhere('mscl.name ilike :cname', {
          cname: '%' + search + '%',
        })
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .orderBy('sc.sequence')
        .getMany();
      console.log(categories);
      // console.lo

      for (const result of categories) {
        dbOutputTime(result);
        if (result.active) {
          result.status = StoreCategoryStatus.ACTIVE;
        } else if (!result.active) {
          result.status = StoreCategoryStatus.INACTIVE;
        }
        if (
          isDefined(result.image) &&
          result.image &&
          !result.image.includes('dummyimage')
        ) {
          const fileNameImage =
            result.image.split('/')[result.image.split('/').length - 1];
          result.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${result.id}/image/${fileNameImage}`;
        }
      }

      const listResult: ListResponse = {
        total_item: categories.length,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: categories,
      };
      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        listResult,
      );
    } catch (error) {
      console.log(error);
    }
  }

  async viewDetailStoreCategory(
    store_catgory_id: string,
  ): Promise<RSuccessMessage> {
    const result = await this.storeCategoriesRepository.findOne({
      where: { id: store_catgory_id },
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
    if (result.active) {
      result.status = StoreCategoryStatus.ACTIVE;
    } else if (!result.active) {
      result.status = StoreCategoryStatus.INACTIVE;
    }
    if (
      isDefined(result.image) &&
      result.image &&
      !result.image.includes('dummyimage')
    ) {
      const fileNameImage =
        result.image.split('/')[result.image.split('/').length - 1];
      result.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${result.id}/image/${fileNameImage}`;
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
    const results = await this.storeCategoriesRepository.find({
      where: { id: In(storeCatgoryIds) },
      relations: ['languages'],
    });
    if (!results) {
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

    for (const result of results) {
      if (
        isDefined(result.image) &&
        result.image &&
        !result.image.includes('dummyimage')
      ) {
        const fileNameImage =
          result.image.split('/')[result.image.split('/').length - 1];
        result.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${result.id}/image/${fileNameImage}`;
      }
    }
    return results;
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

  async getStoreCategoryBufferS3(data: any) {
    try {
      const storeCategory = await this.storeCategoriesRepository.findOne({
        id: data.id,
        image: Like(`%${data.fileName}%`),
      });

      if (!storeCategory) {
        const errors: RMessage = {
          value: data.id,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
      return await this.storage.getImageProperties(storeCategory.image);
    } catch (error) {
      console.error(error);
    }
  }
}
