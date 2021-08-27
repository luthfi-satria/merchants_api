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

@Injectable()
export class StoreCategoriesService {
  constructor(
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoriesRepository: Repository<StoreCategoriesDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private httpService: HttpService,
    private readonly storage: CommonStorageService,
  ) {}

  async createStoreCategories(
    data: Partial<StoreCategoriesValidation>,
  ): Promise<RSuccessMessage> {
    const createStocat: Partial<StoreCategoriesDocument> = {
      name_id: data.name_id,
      name_en: data.name_en,
    };
    try {
      const url = await this.storage.store(data.image);
      createStocat.image = url;
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(e.message);
    }
    if (typeof data.active != 'undefined') {
      createStocat.active = Boolean(data.active).valueOf();
      if (data.active == 'true') createStocat.active = true;
      if (data.active == 'false') createStocat.active = false;
    }
    return await this.storeCategoriesRepository
      .save(createStocat)
      .then(async (result) => {
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
    if (
      data.name_id != null &&
      data.name_id != '' &&
      typeof data.name_id != 'undefined'
    )
      stoCatExist.name_id = data.name_id;
    if (
      data.name_en != null &&
      data.name_en != '' &&
      typeof data.name_en != 'undefined'
    )
      stoCatExist.name_en = data.name_en;
    if (typeof data.active != 'undefined') {
      stoCatExist.active = Boolean(data.active).valueOf();
      if (data.active == 'true') stoCatExist.active = true;
      if (data.active == 'false') stoCatExist.active = false;
    }

    return await this.storeCategoriesRepository
      .save(stoCatExist)
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
      .delete(deleteStoreCategories)
      .then(() => {
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
