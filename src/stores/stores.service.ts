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
  enumDeliveryType,
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
import {
  Brackets,
  FindOperator,
  ILike,
  In,
  Like,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
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
import { isDefined, isUUID } from 'class-validator';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { SetFieldEmptyUtils } from '../utils/set-field-empty-utils';
import { StoreOperationalHoursDocument } from '../database/entities/store_operational_hours.entity';
import moment from 'moment';
import ExcelJS from 'exceljs';
import { Readable } from 'typeorm/platform/PlatformTools';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreDocument)
    public readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
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
          // 'search_history_stores',
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
      if (isUUID(addon_id)) {
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
    }
    return addons;
  }

  async validateStoreUniqueName(
    name: string,
    id?: string,
  ): Promise<StoreDocument> {
    const where: { name: FindOperator<string>; id?: FindOperator<string> } = {
      name: ILike(name),
    };
    if (id) {
      where.id = Not(id);
    }
    const cekStoreName = await this.storeRepository.findOne({
      where,
    });
    if (cekStoreName) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: name,
            property: 'name',
            constraint: [this.messageService.get('merchant.general.nameExist')],
          },
          'Bad Request',
        ),
      );
    }
    return cekStoreName;
  }

  async createMerchantStoreProfile(
    create_merchant_store_validation: CreateMerchantStoreValidation,
    user: Record<string, any>,
  ): Promise<StoreDocument> {
    await this.validateStoreUniqueName(create_merchant_store_validation.name);
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
    console.log(store_document);
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
    await this.validateStoreUniqueName(
      update_merchant_store_validation.name,
      update_merchant_store_validation.id,
    );
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
    if (
      update_merchant_store_validation.service_addons &&
      update_merchant_store_validation.service_addons.length > 0
    ) {
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

    Object.assign(
      store_document,
      new SetFieldEmptyUtils().apply(
        store_document,
        update_merchant_store_validation.delete_files,
      ),
    );

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

        if (
          isDefined(element.image) &&
          element.image &&
          !element.image.includes('dummyimage')
        ) {
          const fileName =
            element.image.split('/')[element.image.split('/').length - 1];
          element.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${element.id}/image/${fileName}`;
        }
      });

      Object.assign(list, {
        operational_hour_status: this.getStoreStatusOpenOrNot(
          list,
          list.operational_hours,
        ),
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
      .leftJoinAndSelect('merchant.group', 'group')
      .leftJoinAndSelect('ms.operational_hours', 'operational_hours')
      .leftJoinAndSelect('operational_hours.shifts', 'shifts');

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
      data.merchant_ids
    ) {
      store.andWhere('merchant.id IN (:...mid)', {
        mid: data.merchant_ids,
      });
    } else if (
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
        } else if (data.merchant_ids) {
          pricingTemplateData.merchant_ids = [
            ...pricingTemplateData.merchant_ids,
            ...data.merchant_ids,
          ];
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
        } else if (data.merchant_ids) {
          pricingTemplateData.merchant_ids = [
            ...pricingTemplateData.merchant_ids,
            ...data.merchant_ids,
          ];
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
          } else if (data.merchant_ids.length > 0) {
            postData.merchant_ids = [
              ...postData.merchant_ids,
              ...data.merchant_ids,
            ];
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

      const list: any = (await store.getMany()).map((store: StoreDocument) => {
        return {
          ...store,
          operational_hours: undefined,
          operational_hour_status: this.getStoreStatusOpenOrNot(
            store,
            store.operational_hours,
          ),
        };
      });

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

  getStoreStatusOpenOrNot(
    store: StoreDocument,
    operationalHours: StoreOperationalHoursDocument[],
  ): string {
    if (!store.is_store_open) {
      return 'CLOSE';
    }

    const dayNowNumber = moment().day();

    const currentHour = moment().format('HH:mm');

    const findOperational = operationalHours.find((operational) => {
      return operational.day_of_week == dayNowNumber;
    });

    if (!findOperational?.is_open) {
      return 'CLOSE';
    }

    if (findOperational?.is_open_24h) {
      return 'OPEN';
    }

    const shifts =
      findOperational.shifts?.length > 0 ? findOperational.shifts : [];

    if (
      shifts.find(
        (shift) =>
          shift.open_hour <= currentHour && shift.close_hour >= currentHour,
      )
    ) {
      return 'OPEN';
    }

    return 'CLOSE';
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
    const store = await this.findMerchantStoreById(storeId); // .findStoreById(storeId);
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

  async findStoreLevelWithoutStatus(store_id: string): Promise<StoreDocument> {
    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group')
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

  manipulateStoreUrl(store: StoreDocument): StoreDocument {
    if (isDefined(store)) {
      if (
        isDefined(store.photo) &&
        store.photo &&
        !store.photo.includes('dummyimage')
      ) {
        console.log('store.photo =>');
        console.log(store.photo);

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

  async findStoresByMultiCriteria(data: any) {
    try {
      const page = data.page || 1;
      const limit = data.limit || 10;
      const offset = (page - 1) * limit;

      const query = this.storeRepository
        .createQueryBuilder('ms')
        .select([
          'ms.id',
          'ms.merchant_id',
          'ms.name',
          'ms.phone',
          'ms.city_id',
          'ms.address',
          'ms.is_store_open',
          'ms.is_open_24h',
          'ms.status',
          'merchant.id',
          'merchant.group_id',
          'merchant.type',
          'merchant.name',
          'merchant.phone',
          'corporate.id',
          'corporate.category',
          'corporate.name',
          'corporate.phone',
          'corporate.status',
        ])
        .innerJoin('ms.merchant', 'merchant')
        .innerJoin('merchant.group', 'corporate');

      if (data.merchant_id) {
        query.where('ms.merchant_id = :merchant_id', {
          merchant_id: data.merchant_id,
        });
      }

      if (typeof data.search != 'undefined' && data.search != '') {
        query.andWhere('ms.name like :src', { src: `%${data.search}%` });
      }

      if (typeof data.status != 'undefined' && data.status != '') {
        query.andWhere('ms.status = :status', { status: data.status });
      }

      if (
        typeof data.store_id != 'undefined' &&
        data.store_id.length > 0 &&
        data.target == 'assigned'
      ) {
        query.andWhere('ms.id IN (:...ids)', { ids: data.store_id });
      }

      if (
        typeof data.store_id != 'undefined' &&
        data.store_id.length > 0 &&
        data.target == 'unassigned'
      ) {
        query.andWhere('ms.id NOT IN (:...ids)', { ids: data.store_id });
      }

      query.orderBy('ms.name', 'DESC').take(limit).skip(offset);

      const items = await query.getMany();
      const count = await query.getCount();

      const listItems = {
        current_page: parseInt(page),
        total_item: count,
        limit: parseInt(limit),
        items: items,
      };

      return listItems;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: 'status',
            property: 'status',
            constraint: [
              this.messageService.get('general.list.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  //** Get Merchants ID By Names */
  async findMerchantByMerchantId(
    merchant_id: string,
    token: string,
  ): Promise<MerchantDocument> {
    console.log(token);
    return this.merchantRepository
      .findOne({
        where: { id: In([merchant_id]) },
        select: ['id'],
      })
      .catch((err) => {
        const errors: RMessage = {
          value: merchant_id,
          property: 'Nama merchant tidak tersedia mohon di periksa kembali!',
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

  //** Get Merchants ID By ID non token */
  async findMerchantByMerchantIds(
    merchant_id: string,
  ): Promise<MerchantDocument> {
    return this.merchantRepository
      .findOne({
        where: { id: merchant_id },
        select: ['id'],
      })
      .catch((err) => {
        const errors: RMessage = {
          value: merchant_id,
          property: 'Nama merchant tidak tersedia mohon di periksa kembali!',
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

  //** Get Merchants ID By Names */
  async findDefaultPhotoByMerchantId(
    merchant_id: string,
  ): Promise<MerchantDocument> {
    return this.merchantRepository
      .findOne({
        where: { id: merchant_id },
        select: ['profile_store_photo'],
      })
      .catch((err) => {
        const errors: RMessage = {
          value: merchant_id,
          property: 'Nama merchant tidak tersedia mohon di periksa kembali!',
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

  //** Check Exists Name Store */
  async findStoreNameByName(store_name: string[]): Promise<StoreDocument[]> {
    return this.storeRepository
      .find({
        where: { name: store_name },
        select: ['name'],
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: 'Nama store tidak tersedia mohon di periksa kembali!',
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

  //** Bulk Insert Stores */
  async uploadStore(path: string, merchant: any): Promise<any> {
    try {
      const merchant_id: string = merchant.id;
      const storeData: Partial<StoreDocument>[] = [];
      const errorMessage: any[] = [];

      //=> Extract data dari excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path);
      const sheetEfood = workbook.getWorksheet('Efood');
      //const sheetBankData = workbook.getWorksheet('Bank_Data');

      // Recheck again for merchant id
      this.findMerchantByMerchantIds(merchant_id).catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: merchant_id,
              property: 'merchant_id',
              constraint: [this.messageService.get('merchantid_notfound')],
            },
            'Bad Request',
          ),
        );
      });

      //=> Validasi Data
      sheetEfood.eachRow((row, rowNumber) => {
        const errorLine = {
          value: rowNumber,
          property: 'line',
          constraints: [],
        };

        if (rowNumber > 2) {
          if (!row.values[1] || row.values[1] == '') {
            errorLine.constraints.push({
              value: row.values[1],
              column: 'Nama Store',
              message: 'Nama store tidak boleh kosong',
            });
          }

          if (!row.values[1] || row.values[1] == '') {
            errorLine.constraints.push({
              value: row.values[1],
              column: 'Nama Store',
              message: 'Nama store tidak boleh kosong',
            });
          } else if (typeof row.values[1] !== 'string') {
            errorLine.constraints.push({
              value: row.values[1],
              column: 'Nama Store',
              message: 'Nama store harus string',
            });
          }

          if (!row.values[2] || row.values[2] == '') {
            errorLine.constraints.push({
              value: row.values[2],
              column: 'Phone',
              message: 'Phone number tidak boleh kosong',
            });
          } else if (typeof row.values[2] !== 'number') {
            errorLine.constraints.push({
              value: row.values[2],
              column: 'Phone',
              message: 'Phone number harus number',
            });
          }

          if (!row.values[3] || row.values[3] == '') {
            errorLine.constraints.push({
              value: row.values[3],
              column: 'Email',
              message: 'Email tidak boleh kosong',
            });
          }

          if (!row.values[4] || row.values[4] == '') {
            errorLine.constraints.push({
              value: row.values[4],
              column: 'Alamat',
              message: 'Alamat tidak boleh kosong',
            });
          }

          if (!'1' || row.values[5] == '') {
            errorLine.constraints.push({
              value: row.values[5],
              column: 'Location Longitude',
              message: 'Location longitude tidak boleh kosong',
            });
          }

          if (!row.values[6] || row.values[6] == '') {
            errorLine.constraints.push({
              value: row.values[6],
              column: 'Location Latitude',
              message: 'Location latitude tidak boleh kosong',
            });
          }

          if (!row.values[7] || row.values[7] == '') {
            errorLine.constraints.push({
              value: row.values[7],
              column: 'Nama Bank',
              message: 'Nama bank tidak boleh kosong',
            });
          } else if (typeof row.values[7] !== 'string') {
            errorLine.constraints.push({
              value: row.values[7],
              column: 'Nama Bank',
              message: 'Nama bank harus string',
            });
          }

          if (!row.values[8] || row.values[8] == '') {
            errorLine.constraints.push({
              value: row.values[8],
              column: 'Nomor Rekening Pemilik Bank',
              message: 'Nomor rekening pemilik bank tidak boleh kosong',
            });
          } else if (typeof row.values[8] !== 'number') {
            errorLine.constraints.push({
              value: row.values[8],
              column: 'Nomor Rekening Pemilik Bank',
              message: 'Nomor rekening pemilik bank harus string',
            });
          }

          if (!row.values[9] || row.values[9] == '') {
            errorLine.constraints.push({
              value: row.values[9],
              column: 'Nama Pemilik Rekening Bank',
              message: 'Name pemilik rekening bank tidak boleh kosong',
            });
          } else if (typeof row.values[9] !== 'string') {
            errorLine.constraints.push({
              value: row.values[9],
              column: 'Nama Pemilik Rekening Bank',
              message: 'Name pemilik rekening bank harus string',
            });
          }

          if (errorLine.constraints.length) {
            errorMessage.push(errorLine);
          }
        }
      });

      //=> Throw jika terdapat error
      if (errorMessage.length) {
        throw new BadRequestException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: errorMessage,
          },
          'Bad Request',
        );
      }

      // Get default photo from merchant ID
      const isDefaultPhoto = await this.findDefaultPhotoByMerchantId(
        merchant_id,
      );
      const defaultPhoto = Object.values(isDefaultPhoto).shift();

      //=> Proses data jika data lengkap
      sheetEfood.eachRow(async (row, rowNumber) => {
        if (rowNumber > 2) {
          storeData.push({
            merchant_id: merchant_id,
            name: row.values[1],
            phone: row.values[2],
            email: row.values[3].text,
            city_id: 'ba9613ec-3d67-4df4-8a84-a45e7006edb8', // default city bandung
            address: row.values[4],
            location_latitude: row.values[5],
            location_longitude: row.values[6],
            gmt_offset: 7,
            is_store_open: true,
            is_open_24h: true,
            average_price: 0,
            platform: true,
            photo: defaultPhoto,
            banner: defaultPhoto,
            delivery_type: enumDeliveryType.delivery_and_pickup,
            bank_id: row.values[7].slice(0, 36),
            bank_account_no: row.values[8],
            rating: null,
            numrating: null,
            numorders: 0,
            bank_account_name: row.values[9],
            auto_accept_order: true,
            status: enumStoreStatus.active,
          });
        }
      });

      // Looping tiap menu, create menu ke DB
      const stores: StoreDocument[] = [];
      const promises = storeData.map(async (store: Partial<StoreDocument>) => {
        // This for check store name Existing
        const store_name = store.name;
        const checkExistingStore = await this.storeRepository.find({
          where: { name: store_name },
          select: ['name'],
        });
        const jsonStoreData = JSON.parse(JSON.stringify(checkExistingStore));

        // Error if store name already
        for (const value of Object.values(jsonStoreData)) {
          if (store_name == value['name']) {
            throw new Error(
              `Nama store (${store_name}!) ini tidak dapat di insert atau sudah digunakan.`,
            );
          }
        }

        // save if name store null
        const create_store = await this.storeRepository.save(store);
        stores.push(create_store);

        await this.storeOperationalService
          .createStoreOperationalHours(create_store.id, create_store.gmt_offset)
          .catch((e) => {
            throw e;
          });

        return create_store;
      });
      return Promise.all(promises)
        .then(async (result_save) => {
          if (!result_save.length) {
            throw new Error('Tidak ada store yang disimpan');
          }

          result_save = result_save.map((val) => {
            dbOutputTime(val);
            return val;
          });

          return this.responseService.success(
            true,
            this.messageService.get('merchant.createstore.success'),
            { menus: result_save },
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
    } catch (error) {
      if (error.message != 'Bad Request Exception') {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: error.value || '',
              property: error.property || '',
              constraint: error.constraint || [
                this.messageService.get('merchant.createstore.fail'),
                error.message,
              ],
            },
            'Bad Request',
          ),
        );
      } else {
        throw error;
      }
    }
  }

  //** Download template bulk upload store  */
  async downloadBulkInsertStoreTemplate(merchant_id: string): Promise<any> {
    try {
      //** get merchant data for create validation */
      const getMerchantDataRow: any = await this.merchantRepository.find({
        where: { id: merchant_id },
        select: ['id', 'name'],
      });

      if (!getMerchantDataRow.length) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: 'merchant_not_found',
              property: getMerchantDataRow,
              constraint: [
                this.messageService.get('Data brand tidak dapat ditemukan.'),
              ],
            },
            'Bad Request',
          ),
        );
      }

      //** get bank data for create validation */
      const url = `${process.env.BASEURL_PAYMENTS_SERVICE}/api/v1/payments/disbursements/methods?page=1&limit=999&statuses[]=ACTIVE&type=BANK_ACCOUNT`;
      const getResponseByUrl = await this.commonService.getHttp(url);
      const getBankDdataRow = getResponseByUrl.data.items;

      if (!getBankDdataRow.length) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: 'data_bank_not_found',
              property: getBankDdataRow,
              constraint: [
                this.messageService.get('Data bank tidak dapat ditemukan.'),
              ],
            },
            'Bad Request',
          ),
        );
      }

      //** create array bank */
      const bankData = getBankDdataRow.map((bankData: any) => {
        const catIndex = `${bankData.id}, (${bankData.name})`;
        return { id: bankData.id, name: catIndex };
      });

      //=> create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Efood';
      const row2: any[] = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];

      //=> create sheetEfood
      const sheetEfood = workbook.addWorksheet('Efood', {
        properties: { defaultColWidth: 20 },
      });

      const sheetEfoodColumns: any[] = [
        {
          header: 'Nama Store*',
          key: 'store_name',
          width: 25,
        },
        {
          header: 'Phone*',
          key: 'phone',
          width: 25,
        },
        {
          header: 'Email*',
          key: 'email',
          width: 20,
        },
        {
          header: 'Alamat*',
          key: 'address',
          width: 25,
        },
        {
          header: 'Lokasi Latitude*',
          key: 'location_latitude',
          width: 25,
        },
        {
          header: 'Lokasi Longitude*',
          key: 'location_longitude',
          width: 25,
        },
        {
          header: 'Nama Bank Pemilik (optional)',
          key: 'bank_name',
          width: 25,
        },
        {
          header: 'Nomor Rekening Bank Pemilik*',
          key: 'bank_account_no',
          width: 25,
        },
        {
          header: 'Nama Pemilik*',
          key: 'bank_account_name',
          width: 25,
        },
      ];

      sheetEfood.columns = sheetEfoodColumns;

      //=> insert row 2
      sheetEfood.addRow(row2);

      //=> merge cells
      sheetEfood.mergeCellsWithoutStyle(1, 1, 2, 1);
      sheetEfood.mergeCellsWithoutStyle(1, 2, 2, 2);
      sheetEfood.mergeCellsWithoutStyle(1, 3, 2, 3);
      sheetEfood.mergeCellsWithoutStyle(1, 4, 2, 4);
      sheetEfood.mergeCellsWithoutStyle(1, 5, 2, 5);
      sheetEfood.mergeCellsWithoutStyle(1, 6, 2, 6);
      sheetEfood.mergeCellsWithoutStyle(1, 7, 2, 7);
      sheetEfood.mergeCellsWithoutStyle(1, 8, 2, 8);
      sheetEfood.mergeCellsWithoutStyle(1, 9, 2, 9);

      //=> Formating row 1 - 2
      sheetEfood.getRow(1).font = { bold: true };
      sheetEfood.getRow(1).alignment = { horizontal: 'center', wrapText: true };
      sheetEfood.getRow(2).font = { bold: true };
      sheetEfood.getRow(2).alignment = { horizontal: 'center', wrapText: true };

      //** create validation sheets bank */
      const sheetBankData = workbook.addWorksheet('Bank_Data', {
        properties: { defaultColWidth: 50 },
      });

      for (const bankDatas of bankData) {
        sheetBankData.addRow(Object.values(bankDatas));
      }

      //** Loop create data validations */
      for (let i = 3; i <= 50; i++) {
        const selectedRow = sheetEfood.getRow(i);

        selectedRow.getCell(1).font = { bold: false };
        selectedRow.getCell(2).numFmt = '';
        selectedRow.getCell(3).font = { bold: false };
        selectedRow.getCell(4).font = { bold: false };
        selectedRow.getCell(5).numFmt = '';
        selectedRow.getCell(6).numFmt = '';
        //** validation bank */
        if (bankData.length) {
          selectedRow.getCell(7).dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: [`Bank_Data!$B$1:$B$${bankData.length}`],
          };
        }
        selectedRow.getCell(8).font = { bold: false };
        selectedRow.getCell(9).font = { bold: false };
      }

      //=> write workbook
      await workbook.xlsx.writeFile(
        `template_bulk_upload_store_${merchant_id}.xlsx`,
      );
      await this.storage.store(
        `template_bulk_upload_store_${merchant_id}.xlsx`,
      );

      const download_url = `${process.env.BASEURL_API}/api/v1/merchants/stores/${merchant_id}/file/template_bulk_upload_store_${merchant_id}.xlsx`;

      return this.responseService.success(
        true,
        this.messageService.get('Template bulk upload store berhasil di buat.'),
        { bulk_upload_store_template: download_url },
      );
    } catch (error) {
      if (error.message != 'Bad Request Exception') {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: error.value || '',
              property: error.property || '',
              constraint: error.constraint || [
                this.messageService.get(
                  'Gagal membuat template bulk upload store.',
                ),
                error.message,
              ],
            },
            'Bad Request',
          ),
        );
      } else {
        throw error;
      }
    }
  }

  //** Download file store upload */
  async getBufferS3Xlsx(data: any) {
    const url = `${process.env.STORAGE_S3_BUCKET}/${data.file_id}`;

    const bufferurl = await this.storage.getBuff(url);

    return bufferurl;
  }

  async getReadableStream(buffer: Buffer) {
    const stream = new Readable();

    // stream._read = () => {};;;
    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}
