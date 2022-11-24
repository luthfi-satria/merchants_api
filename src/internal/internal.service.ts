import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Any, Brackets, ILike, IsNull, Not, Repository } from 'typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoresService } from 'src/stores/stores.service';
import { CommonService } from 'src/common/common.service';
import { deleteCredParam, delExcludeParam } from 'src/utils/general-utils';
import { LoginService } from 'src/login/login.service';
import { GetMerchantUsersDto } from './dto/list_merchant_user.dto';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { QueryService } from 'src/query/query.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { ListStoreDTO } from 'src/stores/validation/list-store.validation';
import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { isDefined } from 'class-validator';
import { MerchantStoresDto } from './dto/merchant_stores.dto';
import { MerchantsService } from 'src/merchants/merchants.service';
import { GroupsService } from 'src/groups/groups.service';
import { CityService } from 'src/common/services/admins/city.service';
import { GetMerchantBulkDataDTO } from './dto/get-merchant-bulk-data.dto';
import { CorporateSapKeyDocument } from '../database/entities/corporate_sap_keys.entity';

@Injectable()
export class InternalService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(CorporateSapKeyDocument)
    private readonly corporateSapKeyDocumentRepository: Repository<CorporateSapKeyDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly storeService: StoresService,
    private readonly commonService: CommonService,
    private readonly loginService: LoginService,
    private readonly merchantUserService: MerchantUsersService,
    private readonly queryService: QueryService,
    private readonly storeCategoryService: StoreCategoriesService,
    private readonly merchantService: MerchantsService,
    private readonly groupService: GroupsService,
    private readonly cityService: CityService,
  ) {}

  async findMerchantUsers(data: GetMerchantBulkDataDTO[]): Promise<any[]> {
    const results = [];

    try {
      for (const item of data) {
        const merchantUser = await this.findMerchantUser(item);

        if (merchantUser) {
          results.push(merchantUser);
        }
      }
    } catch (e) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: null,
            constraint: e?.message,
          },
          'Bad Request',
        ),
      );
    }

    return results;
  }

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
    const detailStore = await this.storeRepository
      .findOne({
        where: { id: id },
        relations: [
          'merchant',
          'operational_hours',
          'operational_hours.shifts',
          'service_addons',
        ],
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
    if (!detailStore) {
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

    const currTime = DateTimeUtils.DateTimeToUTC(new Date());
    const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

    // filter logic store operational status
    detailStore.store_operational_status =
      this.queryService.getStoreOperationalStatus(
        detailStore.is_store_open,
        currTime,
        weekOfDay,
        detailStore.operational_hours,
      );

    return detailStore;
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
      .leftJoinAndSelect('merchant.group', 'group')
      .leftJoinAndSelect('ms.service_addons', 'service_addons');

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

      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/pricing-template/${data.sales_channel_id}`;
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
      const list = await store.getMany();
      const cityObj = {};

      // list.forEach(async (element) => {
      for (const element of list) {
        deleteCredParam(element);
        deleteCredParam(element.merchant);
        const row = deleteCredParam(element.merchant.group);
        if (row.service_addon) {
          row.service_addon.forEach((sao: any) => {
            deleteCredParam(sao);
          });
        }

        if (data?.options?.is_include_city && element.city_id) {
          cityObj[element.city_id] = null;
        }

        // return row;
        await this.storeService.manipulateStoreUrl(element);
        await this.merchantService.manipulateMerchantUrl(element.merchant);
        await this.groupService.manipulateGroupUrl(element.merchant.group);
      }

      if (data?.options?.is_include_city) {
        const { data: cities } = await this.cityService.getCityBulk(
          Object.keys(cityObj),
        );

        for (const city of cities) {
          cityObj[city.id] = city;
        }

        list.forEach((item) => {
          item.city = cityObj[item.city_id];
        });
      }

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

  async listGroups(data: any): Promise<any> {
    try {
      const ids = data.group_ids?.length ? data.group_ids : null;

      return this.groupService.listGroupsByIds(ids);
    } catch (error) {
      throw error;
    }
  }

  async findMerchantbyId(id: string): Promise<MerchantDocument> {
    return this.merchantRepository
      .findOne({
        where: { id: id },
      })
      .then(async (result) => {
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
        await this.merchantService.manipulateMerchantUrl(result);
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
      if (isDefined(raw.store_id)) {
        const updateStoreData: Partial<StoreDocument> = {
          id: raw.store_id,
          average_price: raw.average_price,
        };
        await this.storeService.updateStorePartial(updateStoreData);
      }
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

  async getMerchantStores(data: MerchantStoresDto): Promise<any> {
    let storeData = {};

    storeData = {
      ...storeData,
      merchant_id: data.merchant_id,
      status: Any(data.statuses),
    };

    let options = null;

    if (data.limit && data.page) {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      options = {
        ...options,
        take: limit,
        skip: offset,
        order: { created_at: 'DESC' },
      };
    }

    if (data.search)
      storeData = {
        ...storeData,
        name: ILike('%' + data.search + '%'),
      };

    return this.storeService
      .findMerchantStoresByCriteria(storeData, options, { city: true })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.merchant_id,
              property: 'merchant_id',
              constraint: ['error'],
            },
            'Bad Request',
          ),
        );
      });
  }

  async findMerchantUser(user: any): Promise<MerchantUsersDocument> {
    try {
      const result = await this.loginService.getProfile(user);

      if (result?.merchant) {
        await this.merchantService.manipulateMerchantUrl(result.merchant);
        await this.groupService.manipulateGroupUrl(result.merchant.group);
        delete result.merchant.pic_password;
      }
      if (result?.group) {
        delete result.group.director_password;
        delete result.group.pic_operational_password;
        delete result.group.pic_finance_password;
        await this.groupService.manipulateGroupUrl(result.group);
      }
      if (result?.store) {
        delete result.store.store_categories;
        await this.storeService.manipulateStoreUrl(result.store);
        await this.merchantService.manipulateMerchantUrl(result.store.merchant);

        if (result?.store?.merchant) {
          await this.groupService.manipulateGroupUrl(
            result.store.merchant.group,
          );
        }
      }

      return result;
    } catch (e) {
      console.error(e);

      throw e;
    }
  }

  async getMerchantUsers(data: GetMerchantUsersDto): Promise<any> {
    return this.merchantUserService.getMerchantUsers(data).catch((error) => {
      console.error(error);
      throw error;
    });
  }

  async listStoreByLevel(data: Partial<ListStoreDTO>, user: any): Promise<any> {
    return this.storeService.listStoreByLevel(data, user);
  }

  async findStoreLevel(store_id: string): Promise<StoreDocument> {
    return this.storeService.findStoreLevelWithoutStatus(store_id);
  }

  async findStoreAutomaticRefund(): Promise<any> {
    const result = await this.storeService.findStoresAutomaticRefund();
    return { data: result };
  }

  async getStoreByCategoryBulk(
    storeCategoryIds: string[],
  ): Promise<StoreCategoriesDocument[]> {
    return this.storeCategoryService.getStoreCategoryByIds(storeCategoryIds);
  }
}
