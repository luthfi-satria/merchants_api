import { Injectable, Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { BadRequestException } from '@nestjs/common/exceptions';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Cron } from '@nestjs/schedule/dist';
import { InjectRepository } from '@nestjs/typeorm';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { generateDatabaseDateTime } from 'src/utils/general-utils';
import { Brackets, In, Repository } from 'typeorm';

@Injectable()
export class ElasticsService {
  indexName = 'merchants';
  lastDbUpdate = null;
  // Generate last update time
  lastUpdate = generateDatabaseDateTime(new Date(), '+0700');
  // Disable or enabled process
  startingProcess = 0;
  // Limit Data execution
  limit = 10;
  // data offset
  offset = 0;
  // total store data
  totalData = 0;
  // price range data
  priceRange = [];
  elapsedTime = 1;

  constructor(
    @InjectRepository(SettingDocument)
    private readonly settingRepo: Repository<SettingDocument>,
    @InjectRepository(AddonDocument)
    private readonly addonRepo: Repository<AddonDocument>,
    @InjectRepository(GroupDocument)
    private readonly groupRepo: Repository<GroupDocument>,
    @InjectRepository(LanguageDocument)
    private readonly languageRepo: Repository<LanguageDocument>,
    @InjectRepository(LobDocument)
    private readonly lobRepo: Repository<LobDocument>,
    @InjectRepository(MenuOnlineDocument)
    private readonly menuOnlineRepo: Repository<MenuOnlineDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUserRepo: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepo: Repository<MerchantDocument>,
    @InjectRepository(PriceRangeLanguageDocument)
    private readonly priceRangeLangRepo: Repository<PriceRangeLanguageDocument>,
    @InjectRepository(PriceRangeDocument)
    private readonly priceRangeRepo: Repository<PriceRangeDocument>,
    @InjectRepository(StoreOperationalHoursDocument)
    private readonly operationHourRepo: Repository<StoreOperationalHoursDocument>,
    @InjectRepository(StoreOperationalShiftDocument)
    private readonly operationShiftRepo: Repository<StoreOperationalShiftDocument>,
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCatRepo: Repository<StoreCategoriesDocument>,
    @InjectRepository(StoreDocument)
    private readonly storeRepo: Repository<StoreDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  logger = new Logger(ElasticsService.name);

  @Cron('1/20 * * * * *')
  async syncAll() {
    try {
      await this.getMerchantsConfig();
      this.logger.log('Elastic scheduller status: ' + this.startingProcess);
      if (this.startingProcess) {
        // const syncAddons = await this.getAddons();
        // const syncGroups = await this.getGroups();
        // const syncLobs = await this.getLobs();
        // const syncMenuOnlines = await this.getMenuOnlines();
        // const syncMerchants = await this.getMerchants();
        // const syncPriceRangeLanguages = await this.getPriceRangeLanguages();
        // const syncPriceRanges = await this.getPriceRanges();
        // const syncStoreCategories = await this.getStoreCategories();
        // const syncStoreCategoryLanguages =
        //   await this.getStoreCategoryLanguages();
        // const syncStoreOperationalHours = await this.getStoreOperationalHours();
        // const syncStoreOperationalShift = await this.getStoreOperationalShift();
        // const syncUsers = await this.getUsers();
        const syncStores = await this.getStores();
        if (this.offset >= this.totalData) {
          await this.updateSettings();
        }
        const callback = {
          // syncAddons: syncAddons,
          // syncGroups: syncGroups,
          // syncLobs: syncLobs,
          // syncMenuOnlines: syncMenuOnlines,
          // syncMerchants: syncMerchants,
          // syncPriceRangeLanguages: syncPriceRangeLanguages,
          // syncPriceRanges: syncPriceRanges,
          // syncStoreCategories: syncStoreCategories,
          // syncStoreCategoryLanguages: syncStoreCategoryLanguages,
          // syncStoreOperationalHours: syncStoreOperationalHours,
          // syncStoreOperationalShift: syncStoreOperationalShift,
          // syncUsers: syncUsers,
          syncStores: syncStores,
        };
        console.log(callback, '<= Sync status');
        return callback;
      }
      return {
        code: 400,
        message: 'Process unable to start, please check system configuration',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Getting Last update
   */
  async getMerchantsConfig() {
    const settings = await this.settingRepo.find({
      where: {
        name: In(['ElasticMerchants', 'ElasticProcess', 'ElasticTimeProcess']),
      },
    });
    settings.forEach((element) => {
      if (element.name == 'ElasticMerchants') {
        this.lastDbUpdate = element.value;
      } else if (element.name == 'ElasticProcess') {
        this.startingProcess = parseInt(element.value);
      } else if (element.name == 'ElasticElapsedTime') {
        this.elapsedTime = parseInt(element.value);
      }
    });
    this.logger.log('ELASTIC DB LAST UPDATE: ' + this.lastDbUpdate);
  }

  /**
   * Create and store data into elastic function
   * @param index
   * @param jsonData
   * @returns
   */
  async createElasticIndex(index, jsonData) {
    try {
      if (jsonData.length > 0) {
        index = `${process.env.ELASTICSEARCH_ENV}_efood_${index}`;
        const body = [];
        jsonData.forEach((element) => {
          const elIndex = { _index: index, _id: element.id };
          let operation = null;
          if (
            (element.updated_at > element.created_at ||
              element.deleted_at != null) &&
            this.lastDbUpdate !== null
          ) {
            operation = { update: elIndex };
            body.push(operation, { doc: element });
          } else {
            operation = { create: elIndex };
            body.push(operation, element);
          }
        });

        // insert mapping data into elastic
        const { body: bulkResponse } = await this.elasticsearchService.bulk({
          filter_path: 'items.*.error',
          refresh: 'true',
          body: body,
        });
        // if there is something error
        if (bulkResponse.errors) {
          const erroredDocuments = [];
          // loop entire mapp data and found error
          bulkResponse.items.forEach((action, i) => {
            const operation = Object.keys(action)[0];
            if (action[operation].error) {
              erroredDocuments.push({
                status: action[operation].status,
                error: action[operation].error,
                operation: body[i * 2],
                document: body[i * 2 + 1],
              });
            }
          });
          // logged error found
          console.log(erroredDocuments);
        }

        // counting stored result
        const { body: count } = await this.elasticsearchService.count({
          index: index,
        });
        console.log(count);
        return count;
      }
      return {
        success: true,
        message: 'process skipped, data is empty',
        data: jsonData,
      };
    } catch (error) {
      console.log(error.body.error);
      return error.body.error;
    }
  }

  /**
   * Get Merchants Addons data
   * @returns
   */
  async getAddons() {
    const queryData = this.addonRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex('addons', queryResult);
    return elData;
  }

  /**
   * Get Merchants Group data
   * @returns
   */
  async getGroups() {
    const queryData = this.groupRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex('groups', queryResult);
    return elData;
  }

  /**
   * Get Lobs Data
   * @returns
   */
  async getLobs() {
    const queryData = this.lobRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex('lobs', queryResult);
    return elData;
  }

  /**
   * Get Menu onlines
   * @returns
   */
  async getMenuOnlines() {
    const queryData = this.menuOnlineRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex('menu_onlines', queryResult);
    return elData;
  }

  /**
   * Get merchants data
   * @returns
   */
  async getMerchants() {
    const queryData = this.merchantRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex('merchants', queryResult);
    return elData;
  }

  /**
   * get Price range languages
   * @returns
   */
  async getPriceRangeLanguages() {
    const queryData = this.priceRangeLangRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex(
      'price_range_languages',
      queryResult,
    );
    return elData;
  }

  /**
   * Get Price ranges data
   * @returns
   */
  async getPriceRanges() {
    const queryData = this.priceRangeRepo
      .createQueryBuilder('priceRanges')
      .leftJoinAndSelect('priceRanges.languages', 'languages');

    const queryResult = await queryData.getMany();
    return queryResult;
  }

  /**
   * Get store categories
   * @returns
   */
  async getStoreCategories() {
    const queryData = this.storeCatRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex(
      'store_categories',
      queryResult,
    );
    return elData;
  }

  /**
   * get store category languages data
   * @returns
   */
  async getStoreCategoryLanguages() {
    const queryData = this.languageRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex(
      'store_category_languages',
      queryResult,
    );
    return elData;
  }

  /**
   * get store operational hours data
   * @returns
   */
  async getStoreOperationalHours() {
    const queryData = this.operationHourRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex(
      'store_operational_hours',
      queryResult,
    );
    return elData;
  }

  /**
   * get store operational shift data
   * @returns
   */
  async getStoreOperationalShift() {
    const queryData = this.operationShiftRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex(
      'store_operational_shifts',
      queryResult,
    );
    return elData;
  }

  /**
   * get stores data
   * @returns
   */
  async getStores() {
    if (this.offset == 0) {
      this.priceRange = await this.getPriceRanges();
      const queryCount = this.queryStatement();
      this.totalData = await queryCount.getCount();
    }

    const currTime = DateTimeUtils.DateTimeToUTC(new Date());
    const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

    console.log({
      limit: this.limit,
      offset: this.offset,
      totalData: this.totalData,
      cond: this.offset < this.totalData,
    });

    if (this.offset < this.totalData) {
      const queryData = this.queryStatement();
      const queryResult = await queryData
        .withDeleted()
        .skip(this.offset)
        .take(this.limit)
        .getMany();

      this.offset += this.limit;
      queryResult.forEach((rows) => {
        const store_operational_status = this.getStoreOperationalStatus(
          rows.is_store_open,
          currTime,
          weekOfDay,
          rows.operational_hours,
        );

        const priceRange = this.priceRange.find((pr) => {
          if (
            (pr.price_high >= rows.average_price &&
              pr.price_low <= rows.average_price) ||
            (pr.price_low <= rows.average_price && pr.price_high == 0)
          ) {
            return pr;
          }
        });

        rows['price_symbol'] = priceRange ? priceRange.symbol : null;
        rows['price_range'] = priceRange;
        rows['store_operational_status'] = store_operational_status;
      });
      const elData = await this.createElasticIndex('stores', queryResult);
      return elData;
    }
    this.offset = 0;
    return {};
  }

  queryStatement() {
    const queryData = this.storeRepo
      .createQueryBuilder('merchant_store')
      .select([
        'merchant_store.id',
        'merchant_store.name',
        'merchant_store.location_longitude',
        'merchant_store.location_latitude',
        'merchant_store.is_store_open',
        'merchant_store.is_open_24h',
        'merchant_store.average_price',
        'merchant_store.platform',
        'merchant_store.photo',
        'merchant_store.banner',
        'merchant_store.rating',
        'merchant_store.numrating',
        'merchant_store.status',
        'merchant_store.created_at',
        'merchant_store.updated_at',
        'merchant_store.deleted_at',
        'merchants.id',
        'merchants.group_id',
        'merchants.type',
        'merchants.name',
        'merchants.phone',
        'merchants.logo',
        'merchants.profile_store_photo',
        'merchants.recommended_promo_type',
        'merchants.recommended_discount_type',
        'merchants.recommended_discount_value',
        'merchants.recommended_shopping_discount_type',
        'merchants.recommended_shopping_discount_value',
        'merchants.recommended_delivery_discount_type',
        'merchants.recommended_delivery_discount_value',
        'operational_hours.id',
        'operational_hours.merchant_store_id',
        'operational_hours.day_of_week',
        'operational_hours.is_open',
        'operational_hours.is_open_24h',
        'operational_hours.gmt_offset',
        'operational_shifts.id',
        'operational_shifts.store_operational_id',
        'operational_shifts.open_hour',
        'operational_shifts.close_hour',
        'operational_shifts.created_at',
        'operational_shifts.updated_at',
      ])
      .leftJoin('merchant_store.merchant', 'merchants')
      .leftJoin(
        'merchant_store.operational_hours',
        'operational_hours',
        'operational_hours.merchant_store_id = merchant_store.id',
      )
      .leftJoin(
        'operational_hours.shifts',
        'operational_shifts',
        'operational_shifts.store_operational_id = operational_hours.id',
      )
      .leftJoinAndSelect(
        'merchant_store.store_categories',
        'merchant_store_categories',
      )
      .leftJoinAndSelect(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
      );
    // .leftJoinAndSelect('merchant_store.menus', 'menus');
    if (this.lastDbUpdate) {
      queryData.where(
        new Brackets((qb) => {
          qb.where('merchant_store.updated_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
          qb.orWhere('merchant_store.created_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
          qb.orWhere('merchant_store.deleted_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
        }),
      );
      queryData.orWhere(
        new Brackets((qb) => {
          qb.where('merchants.updated_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
          qb.orWhere('merchants.created_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
          qb.orWhere('merchants.deleted_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
        }),
      );
      queryData.orWhere(
        new Brackets((qb) => {
          qb.where('operational_hours.updated_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
          qb.orWhere('operational_hours.created_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
        }),
      );
      queryData.orWhere(
        new Brackets((qb) => {
          qb.where('operational_shifts.updated_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
          qb.orWhere('operational_shifts.created_at > :lastUpdate', {
            lastUpdate: this.lastDbUpdate,
          });
        }),
      );
    }
    return queryData;
  }
  /**
   * get users data
   * @returns
   */
  async getUsers() {
    const queryData = this.merchantUserRepo.createQueryBuilder();
    if (this.lastDbUpdate) {
      queryData.where('updated_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('created_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
      queryData.orWhere('deleted_at > :lastUpdate', {
        lastUpdate: this.lastDbUpdate,
      });
    }
    const queryResult = await queryData.withDeleted().getMany();

    const elData = await this.createElasticIndex('users', queryResult);
    return elData;
  }

  async restaurantList() {
    const queryData = this.storeRepo
      .createQueryBuilder('merchant_store')
      .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
      .leftJoinAndSelect(
        'merchant_store.operational_hours',
        'operational_hours',
        'operational_hours.merchant_store_id = merchant_store.id',
      )
      .leftJoinAndSelect('merchant_store.merchant', 'merchant')
      .leftJoinAndSelect(
        'operational_hours.shifts',
        'operational_shifts',
        'operational_shifts.store_operational_id = operational_hours.id',
      )
      .leftJoinAndSelect(
        'merchant_store.store_categories',
        'merchant_store_categories',
      )
      .leftJoinAndSelect(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
      );
    // .leftJoinAndSelect('merchant_store.menus', 'menus');
    // if (this.lastDbUpdate) {
    //   queryData.where('merchant_store.updated_at > :lastUpdate', {
    //     lastUpdate: this.lastDbUpdate,
    //   });
    //   queryData.orWhere('merchant_store.created_at > :lastUpdate', {
    //     lastUpdate: this.lastDbUpdate,
    //   });
    //   queryData.orWhere('merchant_store.deleted_at > :lastUpdate', {
    //     lastUpdate: this.lastDbUpdate,
    //   });
    // }
    return queryData.take(10).getMany();
  }

  /**
   * Error handlers
   * @param error
   */
  errorHandler(error) {
    const errors: RMessage = {
      value: '',
      property: '',
      constraint: [
        this.messageService.get('general.redis.createQueueFail'),
        error.message,
      ],
    };
    throw new BadRequestException(
      this.responseService.error(HttpStatus.BAD_REQUEST, errors, 'Bad Request'),
    );
  }

  /**
   * update settings
   * @returns
   */
  async updateSettings() {
    const updateSettings = await this.settingRepo
      .createQueryBuilder()
      .update()
      .set({
        value: this.lastUpdate,
      })
      .where({ name: 'ElasticMerchants' })
      .execute();
    return updateSettings;
  }

  getStoreOperationalStatus(
    is_store_status: boolean,
    currTime: string,
    currWeekDay: number,
    curShiftHour: StoreOperationalHoursDocument[],
  ): boolean {
    const isCurrentDay = curShiftHour.find(
      (row) => row.day_of_week == String(currWeekDay),
    );
    let respectShiftTime = null;
    if (isCurrentDay.shifts.length > 0) {
      respectShiftTime = isCurrentDay.shifts.find((e) =>
        DateTimeUtils.checkTimeBetween(currTime, e.open_hour, e.close_hour),
      );
    }

    return is_store_status &&
      isCurrentDay.is_open &&
      (isCurrentDay.is_open_24h || respectShiftTime)
      ? true
      : false;
  }
}
