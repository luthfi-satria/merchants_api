import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoresService } from 'src/stores/stores.service';
import { CommonService } from 'src/common/common.service';
import { deleteCredParam, delExcludeParam } from 'src/utils/general-utils';
import { NatsService } from 'src/nats/nats.service';

@Injectable()
export class InternalService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly storeService: StoresService,
    private readonly commonService: CommonService,
    private readonly natsService: NatsService,
  ) {}

  async updateRatingStore(id, data) {
    try {
      const store = await this.findStorebyId(id);

      if (!store) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: id,
              property: 'store_id',
              constraint: ['ID tidak ditemukan.'],
            },
            'Bad Request',
          ),
        );
      }

      store.rating =
        store.numrating && store.rating
          ? (store.rating * store.numrating + data.rating) /
            (store.numrating + 1)
          : data.rating;
      store.numrating = store.numrating ? store.numrating + 1 : 1;

      await this.storeService.updateStorePartial(store);
    } catch (err) {
      console.error('error', err);
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [err.message],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    return {
      success: true,
      message: 'SUCCESS',
    };
  }

  async findStorebyId(id: string): Promise<StoreDocument> {
    return this.storeRepository
      .findOne({
        where: { id: id },
      })
      .then((result) => {
        if (!result) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: id,
                property: 'store_id',
                constraint: ['ID tidak ditemukan.'],
              },
              'Bad Request',
            ),
          );
        }
        return result;
      })
      .catch((err) => {
        console.error('error', err);
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
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

  async getMerchantsWithGroupBulk(merchant_ids: string[]): Promise<any> {
    const query = await this.merchantRepository
      .createQueryBuilder('merchants')
      .leftJoinAndSelect('merchants.group', 'group')
      .where('merchants.id IN(:...ids)', { ids: merchant_ids })
      .getMany()
      .catch((err) => {
        console.error('error', err);
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });

    return {
      merchants: query.map((item) =>
        delExcludeParam({ ...item, group: delExcludeParam(item.group) }),
      ),
    };
  }

  async listStores(data: any): Promise<Record<string, any>> {
    const search = data.search || '';
    const status = data.status;
    const ids = data.ids?.length ? data.ids : null;

    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group');

    if (!ids)
      store.where('merchant.id = :mid', {
        mid: data.merchant_id,
      });
    else if (ids) {
      store.where('ms.id in (:...ids)', { ids });
    }

    if (search) {
      store.andWhere(
        new Brackets((qb) => {
          qb.where('ms.name ilike :mname', {
            mname: '%' + search.toLowerCase() + '%',
          });
          qb.orWhere('ms.phone ilike :sname', {
            sname: '%' + search.toLowerCase() + '%',
          });
          qb.orWhere('merchant.name ilike :bname', {
            bname: '%' + search.toLowerCase() + '%',
          });
          qb.orWhere('group.name ilike :gname', {
            gname: '%' + search.toLowerCase() + '%',
          });
        }),
      );
    }

    if (data.status) {
      store.andWhere('ms.status = :status', {
        status: status,
      });
    }

    if (data.sales_channel_id) {
      const store_ids: string[] = [];
      const pricingTemplateData = {
        store_ids: [],
        merchant_ids: [],
        level: 'merchant',
      };

      if (data.merchant_id) {
        pricingTemplateData.merchant_ids.push(data.merchant_id);
      }

      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/pricing-template/${data.sales_channel_id}`;
      const pricingTemplates: any = await this.commonService.postHttp(
        url,
        pricingTemplateData,
      );

      if (pricingTemplates.length > 0) {
        for (const pricingTemplate of pricingTemplates) {
          store_ids.push(pricingTemplate.store_id);
        }
      }
      store.andWhereInIds(store_ids);
    }

    try {
      const totalItems = await store.getCount().catch((err) => {
        console.error('err ', err);
      });
      const list: any = await store.getMany().catch((err2) => {
        console.error('err2 ', err2);
      });
      list.forEach(async (element) => {
        deleteCredParam(element);
        deleteCredParam(element.merchant);
        const row = deleteCredParam(element.merchant.group);
        if (row.service_addon) {
          row.service_addon.forEach((sao: any) => {
            deleteCredParam(sao);
          });
        }
        return row;
      });

      const response = {
        total_item: totalItems,
        items: list,
      };

      if (!data.with_price_category) {
        return response;
      }

      response.items = list;
      return response;
    } catch (error) {
      console.log(
        '===========================Start Database error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Database error==================================',
      );
    }
  }

  async findMerchantbyId(id: string): Promise<MerchantDocument> {
    return this.merchantRepository
      .findOne({
        where: { id: id },
      })
      .then((result) => {
        if (!result) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: id,
                property: 'merchant_id',
                constraint: ['ID tidak ditemukan.'],
              },
              'Bad Request',
            ),
          );
        }
        return result;
      })
      .catch((err) => {
        console.error('error', err);
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
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

  async checkIsActiveRole(role_id: string): Promise<number> {
    return this.merchantUsersRepository.count({
      where: [{ role_id: role_id }, { deleted_at: Not(IsNull()) }],
    });
  }

  async updateStoreAveragePrice(
    args: Record<string, any>[],
  ): Promise<RSuccessMessage> {
    for (const raw of args) {
      const updateStoreData: Partial<StoreDocument> = {
        id: raw.store_id,
        average_price: raw.average_price,
      };
      await this.storeService.updateStorePartial(updateStoreData);
    }
    return {
      success: true,
      message: 'SUCCESS',
    };
  }

  async updateStorePlatform(
    args: Record<string, any>[],
  ): Promise<RSuccessMessage> {
    for (const raw of args) {
      const updateStoreData: Partial<StoreDocument> = {
        id: raw.store_id,
        platform: raw.platform,
      };
      await this.storeService.updateStorePartial(updateStoreData);
    }
    return {
      success: true,
      message: 'SUCCESS',
    };
  }

  async updatePopulateExistingPricingTemplate(): Promise<RSuccessMessage> {
    const findStores = await this.storeService.findMerchantStores();
    const stores = {
      stores: findStores,
    };

    if (stores) {
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/populate_existing_pricing_template`;
      const results: any = await this.commonService.postHttp(url, stores);

      return results;
    }
  }

  async findStoreActivebyMerchantId(
    merchant_id: string,
  ): Promise<StoreDocument[]> {
    const storeData: Partial<StoreDocument> = {
      merchant_id: merchant_id,
      status: enumStoreStatus.active,
    };
    return this.storeService
      .findMerchantStoreByCriteria(storeData)
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: merchant_id,
              property: 'merchant_id',
              constraint: [
                this.messageService.get('merchant.general.dataNotfound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }
}
