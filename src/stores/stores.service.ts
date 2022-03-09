import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { AddonsService } from 'src/addons/addons.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import {
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime, deleteCredParam } from 'src/utils/general-utils';
import { Brackets, Like, Repository, UpdateResult } from 'typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreOperationalService } from './stores-operational.service';
import { UpdateStoreCategoriesValidation } from './validation/update-store-categories.validation';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { CreateMerchantStoreValidation } from './validation/create-merchant-stores.validation';
import { UpdateMerchantStoreValidation } from './validation/update-merchant-stores.validation';
import { CityService } from 'src/common/services/admins/city.service';
import { ListStoreDTO, SearchFields } from './validation/list-store.validation';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { ViewStoreDetailDTO } from './validation/view-store-detail.validation';
import { CommonService } from 'src/common/common.service';
import { GroupsService } from 'src/groups/groups.service';
import { CatalogsService } from 'src/common/catalogs/catalogs.service';
import _ from 'lodash';
import { UsersService } from 'src/users/users.service';
import { NatsService } from 'src/nats/nats.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { isDefined } from 'class-validator';
import { CommonStorageService } from 'src/common/storage/storage.service';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly addonService: AddonsService,
    private httpService: HttpService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantService: MerchantsService,
    private readonly storeOperationalService: StoreOperationalService,
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoriesRepository: Repository<StoreCategoriesDocument>,
    private readonly cityService: CityService,
    private readonly commonService: CommonService,
    private readonly groupService: GroupsService,
    private readonly commonCatalogService: CatalogsService,
    private readonly usersService: UsersService,
    private readonly natsService: NatsService,
    private readonly menuOnlineService: MenuOnlineService,
    private readonly storage: CommonStorageService,
  ) {}

  createInstance(data: StoreDocument): StoreDocument {
    return this.storeRepository.create(data);
  }

  async findStoreById(id: string): Promise<StoreDocument> {
    return this.storeRepository
      .findOne({
        where: { id: id },
        relations: [
          'merchant',
          'merchant.group',
          'store_categories',
          'service_addons',
          // 'bank',
          'operational_hours',
          'search_history_stores',
          'users',
          'menus',
        ],
      })
      .catch((err) => {
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

  async simpleFindStoreById(id: string): Promise<StoreDocument> {
    return this.storeRepository
      .findOne({
        where: { id: id },
      })
      .catch((err) => {
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

  async findMerchantStoreById(id: string): Promise<StoreDocument> {
    return this.storeRepository.findOne(id);
  }

  async findMerchantStoresByIds(ids: string[]): Promise<StoreDocument[]> {
    return this.storeRepository.findByIds(ids);
  }

  async findMerchantStoreByPhone(hp: string): Promise<StoreDocument> {
    return this.storeRepository.findOne({
      where: { owner_phone: hp },
    });
  }

  async findMerchantStoreByEmail(email: string): Promise<StoreDocument> {
    return this.storeRepository.findOne({
      where: { owner_email: email },
    });
  }

  async findMerchantStoreByCriteria(
    data: Partial<StoreDocument>,
  ): Promise<StoreDocument[]> {
    return this.storeRepository.find({
      where: data,
    });
  }

  async findMerchantStoresByCriteria(
    data: any,
    options?: any,
    includes?: any,
  ): Promise<any> {
    let find = {
      where: data,
    };
    if (options) {
      find = { ...find, ...options };
    }

    const [stores, count] = await this.storeRepository.findAndCount(find);

    if (includes?.city) {
      const cityObj = {};
      stores.forEach((store) => {
        cityObj[store.city_id] = null;
      });

      const { data: cities } = await this.cityService.getCityBulk(
        Object.keys(cityObj),
      );

      for (const city of cities) {
        cityObj[city.id] = city;
      }

      stores.forEach((store) => {
        store.city = cityObj[store.city_id];
      });
    }

    return {
      total_item: count,
      limit: options?.take || null,
      current_page: isDefined(options?.skip)
        ? Math.round(options.skip / options.take) + 1
        : null,
      items: stores,
    };
  }

  async findMerchantStores(): Promise<Partial<StoreDocument>[]> {
    return this.storeRepository
      .createQueryBuilder('s')
      .select(['s.id as store_id', 's.merchant_id as merchant_id'])
      .getRawMany()
      .then((results) => {
        return results;
      });
  }

  async getMerchantStoreDetailById(id: string): Promise<StoreDocument> {
    return this.storeRepository.findOne(id, {
      relations: ['operational_hours', 'service_addons'],
    });
  }

  async getCategoriesByIds(ids: string[]): Promise<StoreCategoriesDocument[]> {
    const categories: StoreCategoriesDocument[] = [];
    for (const category_id of ids) {
      const category = await this.storeCategoriesRepository.findOne(
        category_id,
      );
      if (!category) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: category_id,
              property: 'category_ids',
              constraint: [
                this.messageService.get(
                  'merchant.createstore.store_category_not_found',
                ),
              ],
            },
            'Bad Request',
          ),
        );
      }
      dbOutputTime(category);
      categories.push(category);
    }
    return categories;
  }

  async getAddonssBtIds(ids: string[]): Promise<AddonDocument[]> {
    const addons: AddonDocument[] = [];
    for (const addon_id of ids) {
      const addon = await this.addonService.findAddonById(addon_id);
      if (!addon) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: addon_id,
              property: 'service_addon',
              constraint: [
                this.messageService.get('merchant.createstore.addonid_unreg'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      dbOutputTime(addon);
      addons.push(addon);
    }
    return addons;
  }

  async createMerchantStoreProfile(
    create_merchant_store_validation: CreateMerchantStoreValidation,
    user: Record<string, any>,
  ): Promise<StoreDocument> {
    const store_document: Partial<StoreDocument> = {};
    Object.assign(store_document, create_merchant_store_validation);

    store_document.city = await this.cityService.getCity(
      create_merchant_store_validation.city_id,
    );

    const merchant: MerchantDocument =
      await this.merchantService.findMerchantById(
        create_merchant_store_validation.merchant_id,
      );
    if (!merchant) {
      const errors: RMessage = {
        value: create_merchant_store_validation.merchant_id,
        property: 'merchant_id',
        constraint: [
          this.messageService.get('merchant.createstore.merchantid_notfound'),
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

    let flagCreatePricingTemplate = false;
    const countStore = await this.storeRepository.count({
      where: { merchant_id: create_merchant_store_validation.merchant_id },
    });
    if (countStore == 0) {
      flagCreatePricingTemplate = true;
      store_document.platform = true;
    }

    /**
     *  - untuk admin bisa membuat dengan semua merchant.status
     *  - untuk user corporate(group) bisa membuat dengan merchant.status 'ACTIVE' dan 'WAITING APPROVAL'
     *  - untuk user brand(merchant) bisa membuat dengan merchant.status 'ACTIVE', untuk brand ini pake brand dia sendiri jadi logikanya sudah 'ACTIVE'
     **/
    if (
      // untuk user corporate(group) bisa membuat dengan merchant.status 'ACTIVE' dan 'WAITING APPROVAL'
      (user.level == 'group' &&
        ['ACTIVE', 'WAITING_FOR_APPROVAL'].indexOf(merchant.status) < 0) ||
      // untuk user brand(merchant) bisa membuat dengan merchant.status 'ACTIVE', untuk brand ini pake brand dia sendiri jadi logikanya sudah 'ACTIVE'
      (user.level == 'merchant' && merchant.status != 'ACTIVE')
    ) {
      const errors: RMessage = {
        value: create_merchant_store_validation.merchant_id,
        property: 'merchant_id',
        constraint: [
          this.messageService.get('merchant.createstore.merchantid_notactive'),
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

    store_document.store_categories = await this.getCategoriesByIds(
      create_merchant_store_validation.category_ids,
    );
    store_document.service_addons = await this.getAddonssBtIds(
      create_merchant_store_validation.service_addons,
    );

    if (merchant.status == 'WAITING_FOR_APPROVAL') {
      store_document.status = enumStoreStatus.waiting_for_brand_approval;
    }
    if (store_document.status == 'ACTIVE')
      store_document.approved_at = new Date();
    if (store_document.status == 'REJECTED')
      store_document.rejected_at = new Date();

    store_document.auto_accept_order =
      create_merchant_store_validation.auto_accept_order == 'true'
        ? true
        : false;
    const create_store = await this.storeRepository.save(store_document);
    this.publishNatsCreateStore(create_store);
    const operational_hours = await this.storeOperationalService
      .createStoreOperationalHours(create_store.id, create_store.gmt_offset)
      .catch((e) => {
        throw e;
      });

    if (flagCreatePricingTemplate) {
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/populate/pricing-template`;
      const requestData = {
        merchant_id: create_merchant_store_validation.merchant_id,
        store_id: create_store.id,
      };
      await this.commonService.postHttp(url, requestData);
    }

    return Object.assign(create_store, { operational_hours });
  }

  // partial update
  async updateStorePartial(data: Partial<StoreDocument>) {
    try {
      const store = await this.findMerchantStoreById(data.id);
      const oldStatus = store.status;
      Object.assign(store, data);
      console.log(store, '=> store service');

      const updateStore = await this.storeRepository.save(store);
      this.publishNatsUpdateStore(updateStore, oldStatus);
      return updateStore;
    } catch (e) {
      const logger = new Logger();
      logger.log(e, 'Catch Error :  ');
      throw e;
    }
  }

  async updateStoreProfile(data: StoreDocument) {
    try {
      const store = await this.getAndValidateStoreByStoreId(data.id);
      const oldStatus = store.status;
      Object.assign(store, data);
      const updateStore = await this.storeRepository.save(store);
      this.publishNatsUpdateStore(updateStore, oldStatus);
      return updateStore;
    } catch (e) {
      const logger = new Logger();
      logger.log(e, 'Catch Error :  ');
      throw e;
    }
  }

  async updateMerchantStoreProfile(
    update_merchant_store_validation: UpdateMerchantStoreValidation,
    user: Record<string, any>,
  ): Promise<StoreDocument> {
    const store_document: StoreDocument =
      await this.getAndValidateStoreByStoreId(
        update_merchant_store_validation.id,
      );
    const oldStatus = store_document.status;
    if (!store_document) {
      const errors: RMessage = {
        value: update_merchant_store_validation.id,
        property: 'id',
        constraint: [
          this.messageService.get('merchant.updatestore.id_notfound'),
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
    Object.assign(store_document, update_merchant_store_validation);

    if (update_merchant_store_validation.city_id) {
      update_merchant_store_validation.city = await this.cityService.getCity(
        update_merchant_store_validation.city_id,
      );
    }
    if (update_merchant_store_validation.category_ids) {
      store_document.store_categories = await this.getCategoriesByIds(
        update_merchant_store_validation.category_ids,
      );
    }
    if (update_merchant_store_validation.service_addons) {
      store_document.service_addons = await this.getAddonssBtIds(
        update_merchant_store_validation.service_addons,
      );
    }

    const cekmerchant: MerchantDocument =
      await this.merchantService.findMerchantById(store_document.merchant_id);
    if (!cekmerchant) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: update_merchant_store_validation.merchant_id,
            property: 'merchant_id',
            constraint: [
              this.messageService.get(
                'merchant.createstore.merchantid_notfound',
              ),
            ],
          },
          'Bad Request',
        ),
      );
    }
    if (user.user_type != 'admin') {
      if (cekmerchant.status != 'ACTIVE') {
        const errors: RMessage = {
          value: store_document.merchant_id,
          property: 'merchant_id',
          constraint: [
            this.messageService.get(
              'merchant.createstore.merchantid_notactive',
            ),
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
    }

    if (store_document.status == 'ACTIVE')
      if (!store_document.approved_at) store_document.approved_at = new Date();
    if (store_document.status == 'REJECTED')
      store_document.rejected_at = new Date();

    if (update_merchant_store_validation.auto_accept_order) {
      store_document.auto_accept_order =
        update_merchant_store_validation.auto_accept_order == 'true'
          ? true
          : false;
    }
    if (update_merchant_store_validation.rejection_reason)
      store_document.rejection_reason =
        update_merchant_store_validation.rejection_reason;

    const updateStore = await this.storeRepository.save(store_document);

    this.publishNatsUpdateStore(updateStore, oldStatus);
    return updateStore;
  }

  async updateBulkStoresBankDetail(
    role_ids: string[],
    bank_account_name: string,
    bank_account_no: string,
    bank_id: string,
  ) {
    return this.storeRepository
      .createQueryBuilder('stores')
      .update(StoreDocument)
      .set({
        bank_id: bank_id,
        bank_account_name: bank_account_name,
        bank_account_no: bank_account_no,
      })
      .whereInIds(role_ids)
      .useTransaction(true)
      .execute();
  }

  async deleteMerchantStoreProfile(data: string): Promise<any> {
    const store = await this.getAndValidateStoreByStoreId(data);
    try {
      const storeDelete = await this.storeRepository.softDelete(data);
      this.natsService.clientEmit('merchants.store.deleted', store);
      this.merchantUsersRepository.softDelete({ store_id: data });
      return storeDelete;
    } catch (error) {
      const errors: RMessage = {
        value: data,
        property: 'id',
        constraint: [
          this.messageService.get('merchant.deletestore.invalid_id'),
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
  }

  async viewStoreDetail(
    id: string,
    data: ViewStoreDetailDTO,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    try {
      const sid = user.level == 'store' ? user.store_id : id;
      const store = this.storeRepository
        .createQueryBuilder('ms')
        .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
        .leftJoinAndSelect('ms.merchant', 'merchant')
        .leftJoinAndSelect('merchant.group', 'group')
        .leftJoinAndSelect('ms.store_categories', 'merchant_store_categories')
        .leftJoinAndSelect(
          'merchant_store_categories.languages',
          'merchant_store_categories_languages',
          'merchant_store_categories_languages.lang = :lid',
          { lid: data.lang ? data.lang : 'id' },
        )
        .leftJoinAndSelect(
          'ms.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = ms.id',
        )
        .leftJoinAndSelect(
          'operational_hours.shifts',
          'operational_shifts',
          'operational_shifts.store_operational_id = operational_hours.id',
        )
        .where('ms.id = :mid', {
          mid: sid,
        });

      const list = await store.getOne();

      list.store_categories.forEach((element: Record<string, any>) => {
        element.name = element.languages[0].name;
        delete element.languages;

        element.image = isDefined(element.image)
          ? `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${element.id}/image`
          : element.image;
      });
      list.operational_hours.forEach((element) => {
        element.day_of_week = DateTimeUtils.convertToDayOfWeek(
          Number(element.day_of_week),
        );
      });

      list.city = await this.cityService.getCity(list.city_id);

      await this.manipulateStoreUrl(list);
      if (list.merchant) {
        await this.merchantService.manipulateMerchantUrl(list.merchant);
        if (list.merchant.group)
          await this.groupService.manipulateGroupUrl(list.merchant.group);
      }
      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        list,
      );
    } catch (error) {
      const errors: RMessage = {
        value: '',
        property: 'liststore',
        constraint: [this.messageService.get('merchant.liststore.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  async listGroupStore(
    data: ListStoreDTO,
    user: Record<string, string>,
  ): Promise<Record<string, any>> {
    const search = data.search || '';
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    const statuses = data.statuses || [];
    const searchFields = data.search_fields || [];

    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group');
    if (search) {
      store.andWhere(
        new Brackets((qb) => {
          if (searchFields.length > 0) {
            for (const searchField of searchFields) {
              if (searchField == SearchFields.Name) {
                qb.orWhere('ms.name ilike :sname', {
                  sname: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.Phone) {
                qb.orWhere('ms.phone ilike :ophone', {
                  ophone: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.MerchantName) {
                qb.orWhere('merchant.name ilike :mname', {
                  mname: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.MerchantGroupName) {
                qb.orWhere('group.name ilike :gname', {
                  gname: '%' + search + '%',
                });
              }
            }
          } else {
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
          }
        }),
      );
    }

    if (data.group_category) {
      store.andWhere('group.category = :gcat', {
        gcat: data.group_category,
      });
    }

    if (data.status) {
      statuses.push(data.status);
    }
    if (statuses.length > 0) {
      store.andWhere('ms.status in (:...gstat)', {
        gstat: statuses,
      });
    }

    if (
      (user.user_type == 'admin' || user.level == 'group') &&
      data.merchant_id
    ) {
      store.andWhere('merchant.id = :mid', {
        mid: data.merchant_id,
      });
    }

    if (user.level == 'merchant') {
      const userAndStores = await this.usersService.getUserAndStore(user.id);
      if (userAndStores.stores.length > 0) {
        store.innerJoin('ms.users', 'users', 'users.id = :user_id', {
          user_id: user.id,
        });
      }
    }

    if (user.level == 'store') {
      store.andWhere('ms.id = :mid', {
        mid: user.store_id,
      });
    } else {
      if (user.level == 'merchant') {
        store.andWhere('merchant.id = :mid', {
          mid: user.merchant_id,
        });
      } else if (user.level == 'group') {
        store.andWhere('group.id = :group_id', {
          group_id: user.group_id,
        });
      }

      if (user.user_type == 'admin' && data.group_id) {
        store.andWhere('group.id = :gid', {
          gid: data.group_id,
        });
      }
    }

    if (data.sales_channel_id) {
      const store_ids: string[] = [];
      const pricingTemplateData = {
        store_ids: [],
        merchant_ids: [],
        level: 'merchant',
        platform: 'ONLINE',
      };

      if (user.level == 'store') {
        pricingTemplateData.level = 'store';
        pricingTemplateData.store_ids.push(user.store_id);
      } else if (user.level == 'merchant') {
        pricingTemplateData.merchant_ids.push(user.merchant_id);
      } else if (user.level == 'group') {
        if (data.merchant_id) {
          pricingTemplateData.merchant_ids.push(data.merchant_id);
        } else {
          const merchants = await this.merchantService.findMerchantsByGroup(
            user.group_id,
          );
          merchants.forEach((merchant) => {
            pricingTemplateData.merchant_ids.push(merchant.id);
          });
        }
      } else {
        if (data.merchant_id) {
          pricingTemplateData.merchant_ids.push(data.merchant_id);
        } else if (data.group_id) {
          const merchants = await this.merchantService.findMerchantsByGroup(
            data.group_id,
          );
          merchants.forEach((merchant) => {
            pricingTemplateData.merchant_ids.push(merchant.id);
          });
        } else {
          pricingTemplateData.level = 'admin';
        }
      }
      if (data.platform) pricingTemplateData.platform = data.platform;

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
    } else {
      if (data.platform) {
        const postData = {
          store_ids: [],
          merchant_ids: [],
          level: 'merchant',
          platform: 'ONLINE',
        };

        if (user.level == 'store') {
          postData.level = 'store';
          postData.store_ids.push(user.store_id);
        } else if (user.level == 'merchant') {
          postData.merchant_ids.push(user.merchant_id);
        } else if (user.level == 'group') {
          if (data.merchant_id) {
            postData.merchant_ids.push(data.merchant_id);
          } else {
            const merchants = await this.merchantService.findMerchantsByGroup(
              user.group_id,
            );
            merchants.forEach((merchant) => {
              postData.merchant_ids.push(merchant.id);
            });
          }
        } else {
          if (data.merchant_id) {
            postData.merchant_ids.push(data.merchant_id);
          } else if (data.group_id) {
            const merchants = await this.merchantService.findMerchantsByGroup(
              data.group_id,
            );
            merchants.forEach((merchant) => {
              postData.merchant_ids.push(merchant.id);
            });
          } else {
            postData.level = 'admin';
          }
        }
        postData.platform = data.platform;

        const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/menu-store`;
        const platforms: any = await this.commonService
          .postHttp(url, postData)
          .catch((e) => {
            console.error(e);
          });

        const store_ids = [];

        if (platforms) {
          for (const platform of platforms) {
            if (store_ids.indexOf(platform.store_id) == -1) {
              store_ids.push(platform.store_id);
            }
          }
        }

        store.andWhereInIds(store_ids);
      }
    }

    store
      .orderBy('ms.created_at', 'ASC')
      .skip((Number(currentPage) - 1) * perPage)
      .take(perPage);

    try {
      const totalItems = await store.getCount().catch((err) => {
        console.error('err ', err);
      });
      const list: any = await store.getMany();

      for (const element of list) {
        // list.forEach(async (element) => {
        deleteCredParam(element);
        deleteCredParam(element.merchant);

        await this.manipulateStoreUrl(element);
        if (element.merchant) {
          await this.merchantService.manipulateMerchantUrl(element.merchant);
          if (element.merchant.group)
            await this.groupService.manipulateGroupUrl(element.merchant.group);
        }
        const row = deleteCredParam(element.merchant.group);
        if (row.service_addon) {
          row.service_addon.forEach((sao: any) => {
            deleteCredParam(sao);
          });
        }
        // return row;
      }

      const response = {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: list,
      };

      if (!data.with_price_category) {
        return response;
      }

      const storeIds: string[] = [];
      list.forEach((element) => {
        storeIds.push(element.id);
        if (data.sales_channel_id) list.price_category = null;
      });
      const priceCategories =
        await this.commonCatalogService.getPriceCategoryByStoreIds(storeIds);

      for (const priceCategory of priceCategories) {
        const idx = _.findIndex(list, function (ix: any) {
          return ix.id == priceCategory.store_id;
        });

        if (idx != -1) {
          delete priceCategory.store_id;
          if (data.sales_channel_id) {
            if (priceCategory.sales_channel_id == data.sales_channel_id) {
              delete priceCategory.sales_channel_id;
              list[idx].price_category = priceCategory;
            }
          } else {
            delete priceCategory.sales_channel_id;
            if (!list[idx].price_category) {
              list[idx].price_category = priceCategory;
            }
          }
        }
      }
      for (const lis of list) {
        if (!lis.price_category) lis.price_category = null;
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

  async updateStoreCategories(
    args: Partial<UpdateStoreCategoriesValidation>,
  ): Promise<RSuccessMessage> {
    if (args.payload.user_type == 'merchant') {
      const cekStoreId = await this.storeRepository
        .findOne({
          where: { id: args.store_id, merchant_id: args.payload.merchant_id },
        })
        .catch(() => {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: args.store_id,
                property: 'store_id',
                constraint: [
                  this.messageService.get('merchant.general.idNotFound'),
                ],
              },
              'Bad Request',
            ),
          );
        });

      if (!cekStoreId) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.store_id,
              property: 'store_id',
              constraint: [
                this.messageService.get('merchant.general.storeIdNotMatch'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    const stoCatExist = await this.storeRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.store_categories', 'merchant_store_categories')
      .where('s.id = :sid', { sid: args.store_id })
      .getOne()
      .catch(() => {
        const messages = {
          value: args.store_id,
          property: 'store_id',
          constraint: [this.messageService.get('merchant.general.idNotFound')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            messages,
            'Bad Request',
          ),
        );
      });

    const listStoCat: StoreCategoriesDocument[] = [];
    let validStoCatId = true;
    let valueStoCatId: string;

    for (const stocatId of args.category_ids) {
      const cekStoCatId = await this.storeCategoriesRepository.findOne({
        where: { id: stocatId },
        relations: ['languages'],
      });
      if (!cekStoCatId) {
        validStoCatId = false;
        valueStoCatId = stocatId;
        break;
      }
      dbOutputTime(cekStoCatId);
      listStoCat.push(cekStoCatId);
    }
    if (!validStoCatId) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: valueStoCatId,
            property: 'category_ids',
            constraint: [this.messageService.get('merchant.general.invalidID')],
          },
          'Bad Request',
        ),
      );
    }
    stoCatExist.store_categories = listStoCat;
    return this.storeRepository
      .save(stoCatExist)
      .then(async (updateResult) => {
        dbOutputTime(updateResult);
        updateResult.store_categories.forEach((sao) => {
          delete sao.created_at;
          delete sao.updated_at;
        });

        await this.manipulateStoreUrl(updateResult);

        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          stoCatExist,
        );
      })
      .catch((err) => {
        const messages = {
          value: null,
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            messages,
            'Bad Request',
          ),
        );
      });
  }

  async setAllStatusWithWaitingForBrandApprovalByMerchantId(
    merchantId: string,
    status: enumStoreStatus,
  ): Promise<UpdateResult> {
    return this.storeRepository
      .createQueryBuilder()
      .update()
      .set({ status })
      .where('merchant_id = :merchant_id', { merchant_id: merchantId })
      .andWhere('status = :status', {
        status: enumStoreStatus.waiting_for_brand_approval,
      })
      .execute();
  }

  async setAllInactiveByMerchantId(merchantId: string): Promise<UpdateResult> {
    return this.storeRepository
      .createQueryBuilder()
      .update()
      .set({ status: enumStoreStatus.inactive })
      .where('merchant_id = :merchant_id', { merchant_id: merchantId })
      .execute();
  }

  async getAndValidateStoreByStoreId(storeId: string): Promise<StoreDocument> {
    const store = await this.findStoreById(storeId);
    if (!store) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: storeId,
            property: 'store_id',
            constraint: [
              this.messageService.get('merchant.updatestore.id_notfound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return store;
  }

  async simpleGetAndValidateStoreByStoreId(
    storeId: string,
  ): Promise<StoreDocument> {
    const store = await this.simpleFindStoreById(storeId);
    if (!store) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: storeId,
            property: 'store_id',
            constraint: [
              this.messageService.get('merchant.updatestore.id_notfound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return store;
  }

  //Publish Payload to Nats
  publishNatsUpdateStore(
    payload: StoreDocument,
    oldStatus: enumStoreStatus = enumStoreStatus.active,
  ) {
    if (payload.status == enumStoreStatus.inactive) {
      this.natsService.clientEmit('merchants.store.deleted', payload);
    } else if (
      payload.status == enumStoreStatus.active &&
      oldStatus == enumStoreStatus.inactive
    ) {
      this.natsService.clientEmit('merchants.store.created', payload);
    } else if (payload.status == enumStoreStatus.active) {
      this.natsService.clientEmit('merchants.store.updated', payload);
    }
  }

  async publishNatsCreateStore(payload: StoreDocument) {
    if (payload.status == enumStoreStatus.active) {
      const store = await this.getAndValidateStoreByStoreId(payload.id);
      this.natsService.clientEmit('merchants.store.created', store);
    }
  }
  //------------------------------------------------------------------------------

  async getHttp(
    url: string,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.get(url, { headers: headers }).pipe(
      map((response: any) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }

  async listStoreByLevel(
    data: Partial<ListStoreDTO>,
    user: any,
  ): Promise<ListResponse> {
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;

    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group')
      .where('ms.status = :sstat', { sstat: 'ACTIVE' })
      .andWhere('merchant.status = :mstat', { mstat: 'ACTIVE' })
      .andWhere('group.status = :gstat', { gstat: 'ACTIVE' });

    if (user.level == 'store') {
      store.andWhere('ms.id = :stid', {
        stid: user.store_id,
      });
    } else if (user.level == 'merchant') {
      store.andWhere('merchant.id = :mid', {
        mid: user.merchant_id,
      });
      if (data.store_id) {
        store.andWhere('ms.id = :stid', {
          stid: data.store_id,
        });
      }
    } else if (user.level == 'group') {
      store.andWhere('group.id = :gid', {
        gid: user.group_id,
      });
      if (data.store_id) {
        store.andWhere('ms.id = :stid', {
          stid: data.store_id,
        });
      }
      if (data.merchant_id) {
        store.andWhere('merchant.id = :mid', {
          mid: data.merchant_id,
        });
      }
    } else {
      if (data.store_id) {
        store.andWhere('ms.id = :stid', {
          stid: data.store_id,
        });
      }
      if (data.merchant_id) {
        store.andWhere('merchant.id = :mid', {
          mid: data.merchant_id,
        });
      }
      if (data.group_id) {
        store.andWhere('group.id = :gid', {
          gid: data.group_id,
        });
      }
    }

    store
      .orderBy('ms.created_at', 'ASC')
      .skip((Number(currentPage) - 1) * perPage)
      .take(perPage);

    try {
      const totalItems = await store.getCount();
      const list = await store.getMany();

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

        await this.manipulateStoreUrl(element);
        await this.merchantService.manipulateMerchantUrl(element.merchant);
        await this.groupService.manipulateGroupUrl(element.merchant.group);

        // return row;
      }

      return {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: list,
      };
    } catch (error) {
      console.error(
        '===========================Start Database error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Database error==================================',
      );
    }
  }

  async findStoreLevel(store_id: string): Promise<StoreDocument> {
    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group')
      .where('ms.status = :sstat', { sstat: 'ACTIVE' })
      .andWhere('merchant.status = :mstat', { mstat: 'ACTIVE' })
      .andWhere('group.status = :gstat', { gstat: 'ACTIVE' })
      .andWhere('ms.id = :mid', {
        mid: store_id,
      });

    try {
      return await store.getOne();
    } catch (error) {
      console.error(
        '===========================Start Database error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Database error==================================',
      );
    }
  }

  async findStoresAutomaticRefund(): Promise<StoreDocument[]> {
    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group')
      .where('ms.bank_id is not null')
      .where('ms.status = :sstat', { sstat: 'ACTIVE' })
      .andWhere('merchant.status = :mstat', { mstat: 'ACTIVE' })
      .andWhere('group.status = :gstat', { gstat: 'ACTIVE' })
      .andWhere('merchant.is_manual_refund_enabled = :mre', { mre: false })
      .orderBy('ms.created_at', 'ASC');

    try {
      const result = await store.getMany();
      return result;
    } catch (error) {
      console.error(
        '===========================Start Database error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Database error==================================',
      );
    }
  }

  async updateNumDiscounts(data: any, action: string) {
    this.calculateDiscountPriceMenuOnline(data, action);

    const urlmp = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/menu-price/${data.menu_price_id}`;
    const menuPrice: any = await this.commonService.getHttp(urlmp);

    if (
      menuPrice &&
      menuPrice.menu_sales_channel &&
      menuPrice.menu_sales_channel.platform == 'ONLINE'
    ) {
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/discounts/active/${data.store_id}`;
      const discounts: any = await this.commonService.getHttp(url);
      const store = { store_id: data.store_id, count: 0 };

      if (!discounts) {
        store.count = null;
      } else {
        for (const discount of discounts) {
          if (discount.discount_status == 'ACTIVE') {
            store.count += 1;
          }
        }
      }

      await this.storeRepository.update(store.store_id, {
        numdiscounts: store.count,
      });
    }
  }

  async calculateDiscountPriceMenuOnline(data: any, action: string) {
    let discountedPrice = null;
    if (action == 'started') {
      if (data.type == 'PRICE') {
        discountedPrice = data.value;
      } else if (data.type == 'PERCENTAGE') {
        discountedPrice =
          data.menu_price.price - (data.value / 100) * data.menu_price.price;
      }
    }
    const criteria: Partial<MenuOnlineDocument> = {
      store_id: data.store_id,
      menu_price_id: data.menu_price_id,
    };
    await this.menuOnlineService.updateMenuPriceByCriteria(criteria, {
      discounted_price: discountedPrice,
    });
  }

  async getStoreBufferS3(data: any) {
    try {
      const merchant = await this.storeRepository.findOne({
        id: data.id,
        [data.doc]: Like(`%${data.fileName}%`),
      });

      if (!merchant) {
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
      return await this.storage.getImageProperties(merchant[data.doc]);
    } catch (error) {
      console.error(error);
    }
  }

  async manipulateStoreUrl(store: StoreDocument): Promise<StoreDocument> {
    if (isDefined(store)) {
      if (
        isDefined(store.photo) &&
        store.photo &&
        !store.photo.includes('dummyimage')
      ) {
        const fileNamePhoto =
          store.photo.split('/')[store.photo.split('/').length - 1];
        store.photo = `${process.env.BASEURL_API}/api/v1/merchants/stores/photo/${store.id}/image/${fileNamePhoto}`;
      }

      if (
        isDefined(store.banner) &&
        store.banner &&
        !store.banner.includes('dummyimage')
      ) {
        const fileNameBanner =
          store.banner.split('/')[store.banner.split('/').length - 1];
        store.banner = `${process.env.BASEURL_API}/api/v1/merchants/stores/banner/${store.id}/image/${fileNameBanner}`;
      }
      return store;
    }
  }
}
