import { Injectable, Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { BadRequestException } from '@nestjs/common/exceptions';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectRepository } from '@nestjs/typeorm';
import { doc } from 'prettier';
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
import { generateDatabaseDateTime } from 'src/utils/general-utils';
import { Repository } from 'typeorm';

@Injectable()
export class ElasticsService {
  indexName = 'merchants';
  lastDbUpdate = null;
  lastUpdate = generateDatabaseDateTime(new Date(), '+0700');

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
  ) {
    // auto initiate configuration
    // this.getMerchantsConfig();
  }

  logger = new Logger();

  async syncAll() {
    try {
      await this.getMerchantsConfig();
      const syncAddons = await this.getAddons();
      const syncGroups = await this.getGroups();
      const syncLobs = await this.getLobs();
      const syncMenuOnlines = await this.getMenuOnlines();
      const syncMerchants = await this.getMerchants();
      const syncPriceRangeLanguages = await this.getPriceRangeLanguages();
      const syncPriceRanges = await this.getPriceRanges();
      const syncStoreCategories = await this.getStoreCategories();
      const syncStoreCategoryLanguages = await this.getStoreCategoryLanguages();
      const syncStoreOperationalHours = await this.getStoreOperationalHours();
      const syncStoreOperationalShift = await this.getStoreOperationalShift();
      const syncStores = await this.getStores();
      const syncUsers = await this.getUsers();
      await this.updateSettings();
      return {
        syncAddons: syncAddons,
        syncGroups: syncGroups,
        syncLobs: syncLobs,
        syncMenuOnlines: syncMenuOnlines,
        syncMerchants: syncMerchants,
        syncPriceRangeLanguages: syncPriceRangeLanguages,
        syncPriceRanges: syncPriceRanges,
        syncStoreCategories: syncStoreCategories,
        syncStoreCategoryLanguages: syncStoreCategoryLanguages,
        syncStoreOperationalHours: syncStoreOperationalHours,
        syncStoreOperationalShift: syncStoreOperationalShift,
        syncStores: syncStores,
        syncUsers: syncUsers,
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
    const settings = await this.settingRepo.findOne({
      name: 'ElasticMerchants',
    });
    this.lastDbUpdate = settings.value;
    this.logger.log(this.lastDbUpdate, 'ELASTIC DB LAST UPDATE');
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
        index = `merchants_${index}`;
        const body = [];
        jsonData.forEach((element) => {
          const elIndex = { _index: index, _id: element.id };
          let operation = null;
          if (
            element.updated_at > element.created_at ||
            element.deleted_at != null
          ) {
            operation = { update: elIndex };
          } else {
            operation = { create: elIndex };
          }
          body.push(operation, { doc: element });
        });
        // return body;
        // return {
        //   jsonData: jsonData,
        //   body: body,
        // };
        // insert mapping data into elastic
        const { body: bulkResponse } = await this.elasticsearchService.bulk({
          filter_path: 'items.*.error',
          refresh: 'true',
          body,
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
    const queryData = this.priceRangeRepo.createQueryBuilder();
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

    const elData = await this.createElasticIndex('price_ranges', queryResult);
    return elData;
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
    const queryData = this.storeRepo.createQueryBuilder();
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

    const elData = await this.createElasticIndex('stores', queryResult);
    return elData;
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
}
