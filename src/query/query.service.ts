import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import {
  enumDeliveryType,
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime, getDistanceInKilometers } from 'src/utils/general-utils';
import { Brackets, OrderByCondition, Repository } from 'typeorm';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import {
  QueryListStoreDto,
  QueryStoreDetailDto,
} from './validation/query-public.dto';
import _ from 'lodash';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import {
  QuerySearchHistoryStoresValidation,
  QuerySearchHistoryValidation,
  QuerySearchValidation,
} from './validation/query_search.validation';
import { PriceRangeService } from 'src/price_range/price_range.service';
import { SearchHistoryKeywordDocument } from 'src/database/entities/search_history_keyword.entity';
import { SearchHistoryStoreDocument } from 'src/database/entities/search_history_store.entity';
import { CatalogsService } from 'src/common/catalogs/catalogs.service';
import { SettingsService } from 'src/settings/settings.service';
// import { SearchHistoryKeywordDocument } from 'src/database/entities/search_history_keyword.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoryRepository: Repository<StoreCategoriesDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly priceRangeService: PriceRangeService,
    private readonly storeOperationalService: StoreOperationalService,
    private readonly settingService: SettingsService,
    private readonly catalogsService: CatalogsService,
    private httpService: HttpService,
    @InjectRepository(SearchHistoryKeywordDocument)
    private readonly searchHistoryKeywordDocument: Repository<SearchHistoryKeywordDocument>,
    @InjectRepository(SearchHistoryStoreDocument)
    private readonly searchHistoryStoreDocument: Repository<SearchHistoryStoreDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
  ) {}

  private async getFilterPricesRange(
    price_filter_ids: string[],
  ): Promise<[boolean, number[], number[]]> {
    if (!price_filter_ids) return [false, [], []];

    const [priceLow, priceHigh] = await this.priceRangeService
      .findPricesByIds(price_filter_ids)
      .then((item) => {
        const low = item.map((i) => i.price_low);
        const high = item.map((i) => i.price_high);

        return [low, high];
      });
    return [true, priceLow, priceHigh];
  }

  private applySortFilter(order: string, sort: string): OrderByCondition {
    // Default always sort by distance_in_km
    const OrderQuery: OrderByCondition = {
      distance_in_km: 'ASC',
    };
    if (!order || !sort) return OrderQuery;

    switch (sort) {
      case 'price':
        Object.assign(OrderQuery, {
          'merchant_store.average_price': order || 'ASC',
        });
        break;
      default:
    }
    return OrderQuery;
  }

  private async getBudgetMealMaxValue(
    isBudgetMeal = false,
  ): Promise<[boolean, number]> {
    if (!isBudgetMeal) return [false, 0];
    const budgetMaxValue = await this.settingService.findByName(
      'budget_meal_max',
    );

    if (!budgetMaxValue) {
      Logger.warn(`WARNING setting 'budget_meal_max' is not defined!`);
      throw new Error(`WARNING setting 'budget_meal_max' is not defined!`);
    }
    return [true, parseInt(budgetMaxValue.value, 10)];
  }

  async listGroupStore(data: QueryListStoreDto): Promise<RSuccessMessage> {
    let search = data.search || '';
    const radius = data.distance || 25;
    const lat = data.location_latitude;
    const long = data.location_longitude;
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    let totalItems = 0;
    const store_category_id: string = data.store_category_id || null;

    let delivery_only;
    if (data.pickup) {
      delivery_only =
        data.pickup == true
          ? [enumDeliveryType.delivery_and_pickup, enumDeliveryType.pickup_only]
          : [enumDeliveryType.delivery_only];
    } else {
      delivery_only = [
        enumDeliveryType.delivery_and_pickup,
        enumDeliveryType.pickup_only,
        enumDeliveryType.delivery_only,
      ];
    }
    const is24hour = data?.is_24hrs ? true : false;
    const open_24_hour = data.is_24hrs || false;

    const currTime = DateTimeUtils.DateTimeToUTC(new Date());
    const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
    const lang = data.lang || 'id';
    const qlistStore = this.storeRepository
      .createQueryBuilder('merchant_store')
      .addSelect(
        '(6371 * ACOS(COS(RADIANS(' +
          lat +
          ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
          long +
          ')) + SIN(RADIANS(' +
          lat +
          ')) * SIN(RADIANS(merchant_store.location_latitude))))',
        'distance_in_km',
      )
      .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
      .leftJoinAndSelect(
        'merchant_store.operational_hours',
        'operational_hours',
        'operational_hours.merchant_store_id = merchant_store.id',
      );

    if (store_category_id) {
      qlistStore.leftJoinAndSelect(
        'merchant_store.store_categories',
        'merchant_store_categories',
      );
    }

    const listCount = await qlistStore
      .where(
        `merchant_store.status = :active
        AND (6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(:long)) + SIN(RADIANS(:lat)) * SIN(RADIANS(merchant_store.location_latitude)))) <= :radius
        ${is24hour ? `AND merchant_store.is_open_24h = :open_24_hour` : ''}
        ${delivery_only ? `AND delivery_type in (:...delivery_only)` : ''}
        ${
          store_category_id ? `AND merchant_store_categories.id = :stocat` : ''
        }`,
        {
          active: enumStoreStatus.active,
          open_24_hour: open_24_hour,
          delivery_only: delivery_only,
          stocat: store_category_id,
          radius: radius,
          lat: lat,
          long: long,
        },
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('operational_hours.day_of_week = :weekOfDay', {
            weekOfDay: weekOfDay,
          });
          qb.andWhere(
            new Brackets((qb) => {
              qb.where('operational_hours.is_open_24h = :is_open_24h', {
                is_open_24h: true,
              }).orWhere(
                new Brackets((qb) => {
                  qb.where(':currTime >= operational_hours.open_hour', {
                    currTime: currTime,
                  });
                  qb.andWhere(':currTime < operational_hours.close_hour', {
                    currTime: currTime,
                  });
                }),
              );
            }),
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('merchant_store.name ilike :mname', {
            mname: '%' + search + '%',
          })
            .orWhere('merchant_store.phone ilike :sname', {
              sname: '%' + search + '%',
            })
            .orWhere('merchant_store.owner_phone ilike :shp', {
              shp: '%' + search + '%',
            })
            .orWhere('merchant_store.owner_email ilike :smail', {
              smail: '%' + search + '%',
            })
            .orWhere('merchant_store.address ilike :astrore', {
              astrore: '%' + search + '%',
            })
            .orWhere('merchant_store.post_code ilike :pcode', {
              pcode: '%' + search + '%',
            })
            .orWhere('merchant_store.guidance ilike :guidance', {
              guidance: '%' + search + '%',
              // })
              // .orWhere('merchant_store.location_longitude ilike :long', {
              //   long: '%' + search + '%',
              // })
              // .orWhere('merchant_store.location_latitude ilike :lat', {
              //   lat: '%' + search + '%',
            });
        }),
      )
      .orderBy('distance_in_km', 'ASC')
      .offset((currentPage - 1) * perPage)
      .limit(perPage)
      .getManyAndCount()
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [
                this.messageService.get('merchant.liststore.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    totalItems = listCount[1];
    const listId = [];
    listCount[0].forEach((item) => {
      listId.push(item.id);
    });
    const qListData = this.storeRepository
      .createQueryBuilder('merchant_store')
      .addSelect(
        '(6371 * ACOS(COS(RADIANS(' +
          lat +
          ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
          long +
          ')) + SIN(RADIANS(' +
          lat +
          ')) * SIN(RADIANS(merchant_store.location_latitude))))',
        'distance_in_km',
      )
      .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
      .leftJoinAndSelect(
        'merchant_store.operational_hours',
        'operational_hours',
        'operational_hours.merchant_store_id = merchant_store.id',
      )
      .leftJoinAndSelect(
        'merchant_store.store_categories',
        'merchant_store_categories',
      )
      .leftJoinAndSelect(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
      );

    let items = [];
    if (listId.length > 0) {
      qListData.where('merchant_store.id IN(:...ids)', { ids: listId });

      const listItem = await qListData.getRawMany().catch((err) => {
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
      items = await this.manipulateStoreDistance2(listItem, lang);
      listItem.forEach((row) => {
        dbOutputTime(row);
        delete row.owner_password;
      });
    }
    const list_result: ListResponse = {
      total_item: totalItems,
      limit: Number(perPage),
      current_page: Number(currentPage),
      items: items,
    };
    return this.responseService.success(
      true,
      this.messageService.get('merchant.liststore.success'),
      list_result,
    );
  }

  async getDetailedQueryStore(
    id: string,
    query: QueryStoreDetailDto,
  ): Promise<StoreDocument> {
    try {
      const { location_latitude, location_longitude, lang } = query;

      const currTime = DateTimeUtils.DateTimeToUTC(new Date());
      const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
      const language = lang || 'id';

      return await this.storeRepository
        .createQueryBuilder('merchant_store')
        .addSelect(
          '(6371 * ACOS(COS(RADIANS(' +
            location_latitude +
            ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
            location_longitude +
            ')) + SIN(RADIANS(' +
            location_latitude +
            ')) * SIN(RADIANS(merchant_store.location_latitude))))',
          'distance_in_km',
        )
        // --- JOIN TABLES ---
        .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
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
        )
        .where('merchant_store.id = :id', { id: id })
        .getOne()
        .then(async (row) => {
          // Formatting store detail result,
          const distance_in_km = getDistanceInKilometers(
            parseFloat(location_latitude),
            parseFloat(location_longitude),
            row.location_latitude,
            row.location_longitude,
          );

          // // Get relation of operational store & operational shift,
          const opt_hours = await this.storeOperationalService
            .getAllStoreScheduleByStoreId(row.id)
            .then((res) => {
              return res.map((e) => {
                const dayOfWeekToWord = DateTimeUtils.convertToDayOfWeek(
                  Number(e.day_of_week),
                );
                const x = new StoreOperationalHoursDocument({ ...e });
                delete x.day_of_week;
                return {
                  ...x,
                  day_of_week: dayOfWeekToWord,
                };
              });
            });

          // Parse Store Categories with localization category language name
          const store_categories = row.store_categories.map((item) => {
            const ctg_language = item.languages.find(
              (e) => e.lang === language,
            );

            const x = new StoreCategoriesDocument({ ...item });
            delete x.languages;
            return { ...x, name: ctg_language.name };
          });

          // filter logic store operational status
          const store_operational_status = this.getStoreOperationalStatus(
            row.is_store_open,
            currTime,
            weekOfDay,
            row.operational_hours,
          );

          // Get Merchant Profile
          const merchant = await this.merchantRepository
            .findOne(row.merchant_id)
            .then((result) => {
              delete result.pic_password;
              delete result.approved_at;
              delete result.created_at;
              delete result.updated_at;
              delete result.deleted_at;
              return result;
            });

          return {
            ...row,
            operational_hours: opt_hours,
            store_categories,
            merchant,
            store_operational_status,
            distance_in_km,
          };
        });
    } catch (e) {
      Logger.error('ERROR', '', `Query Detailed Store`);
      throw e;
    }
  }

  async getListQueryStore(
    data: QueryListStoreDto,
    options: any = {},
  ): Promise<RSuccessMessage> {
    try {
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;

      const radius = data.distance || 25;
      const lat = data.location_latitude;
      const long = data.location_longitude;
      const store_category_id: string = data.store_category_id || null;

      // Apply dynamic Sort & order by
      const orderBy = data.order || null;
      const sort = data.sort || null;
      const OrderFilter = this.applySortFilter(orderBy, sort);

      // Apply Price Range query filter
      const [is_filter_price, priceLow, priceHigh] =
        await this.getFilterPricesRange(data.price_range_id);

      // Apply Delivery Status filter
      let delivery_only;
      if (data.pickup) {
        delivery_only =
          data.pickup == true
            ? [
                enumDeliveryType.delivery_and_pickup,
                enumDeliveryType.pickup_only,
              ]
            : [enumDeliveryType.delivery_only];
      } else {
        delivery_only = [
          enumDeliveryType.delivery_and_pickup,
          enumDeliveryType.pickup_only,
          enumDeliveryType.delivery_only,
        ];
      }

      // Apply store is open 24-hours filter
      const is24hrs = data?.is_24hrs ? true : false;
      const open_24_hour = data.is_24hrs;

      // Apply Include store closed filter
      const include_closed_stores = data.include_closed_stores || false;

      const currTime = DateTimeUtils.DateTimeToUTC(new Date());
      const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
      const lang = data.lang || 'id';

      // Apply 'new_this_week' query filter
      const newThisWeek = data.new_this_week || false;
      const lastWeek = DateTimeUtils.getNewThisWeekDate(new Date());

      // Apply Budget Meal
      const [isBudgetEnable, budgetMaxValue] = await this.getBudgetMealMaxValue(
        data.budget_meal,
      );

      Logger.debug(
        `filter params:
        current time: ${currTime} UTC+0
        week of day: ${weekOfDay}
        is24hour: ${is24hrs}
        open_24_hour: ${open_24_hour}
        include_closed_stores: ${include_closed_stores}
        delivery_only: ${delivery_only}
        is_filter_price: ${is_filter_price}
        prices_list_low: ${priceLow}
        prices_list_high: ${priceHigh}
        new_This_week_date: ${lastWeek}
        order Query: ${OrderFilter}
      `,
        'Query List Stores',
      );

      const query1 = this.storeRepository
        .createQueryBuilder('merchant_store')
        .addSelect(
          '(6371 * ACOS(COS(RADIANS(' +
            lat +
            ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
            long +
            ')) + SIN(RADIANS(' +
            lat +
            ')) * SIN(RADIANS(merchant_store.location_latitude))))',
          'distance_in_km',
        )
        // --- JOIN TABLES ---
        .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
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
        )
        // --- Filter Conditions ---
        // ${delivery_only ? `AND delivery_type = :delivery_only` : ''}

        .where(
          `merchant_store.status = :active
            AND (6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(:long)) + SIN(RADIANS(:lat)) * SIN(RADIANS(merchant_store.location_latitude)))) <= :radius
            ${is24hrs ? `AND merchant_store.is_open_24h = :open_24_hour` : ''}
            ${delivery_only ? `AND delivery_type in (:...delivery_only)` : ''}
            ${
              store_category_id
                ? `AND merchant_store_categories.id = :stocat`
                : ''
            }
            ${
              is_filter_price
                ? `AND merchant_store.average_price >= ANY(:priceLow) `
                : ''
            }
            ${
              is_filter_price && !priceHigh.includes(0)
                ? `AND merchant_store.average_price <= ANY(:priceHigh)`
                : ''
            }
            ${
              newThisWeek
                ? `AND merchant_store.approved_at >= :newThisWeekDate`
                : ''
            }
            ${
              isBudgetEnable
                ? `AND merchant_store.average_price <= :budgetMaxValue`
                : ''
            }
            `,
          {
            active: enumStoreStatus.active,
            open_24_hour: open_24_hour,
            delivery_only: delivery_only,
            stocat: store_category_id,
            radius: radius,
            lat: lat,
            long: long,
            priceLow: priceLow,
            priceHigh: priceHigh,
            newThisWeekDate: lastWeek,
            budgetMaxValue: budgetMaxValue,
          },
        )
        .andWhere(
          new Brackets((qb) => {
            if (include_closed_stores) {
              // Tampilkan semua stores, tanpa memperhatikan jadwal operasional store
              qb.where(`operational_hours.day_of_week = :weekOfDay`, {
                weekOfDay: weekOfDay,
              });
            } else {
              qb.where(
                `operational_hours.day_of_week = :weekOfDay
                  AND merchant_store.is_store_open = :is_open
                  AND operational_hours.merchant_store_id IS NOT NULL
                ${
                  // jika params 'is24hrs' is 'false' / tidak di define, query list store include dgn store yg buka 24jam
                  is24hrs == false
                    ? `AND ((:currTime >= operational_shifts.open_hour AND :currTime < operational_shifts.close_hour) OR operational_hours.is_open_24h = :all24h)`
                    : ''
                }`,
                {
                  is_open: true,
                  weekOfDay: weekOfDay,
                  currTime: currTime,
                  all24h: true, //niel true for query all stores
                },
              );
            }
          }),
        )
        .orderBy(OrderFilter);

      if (!options.fetch_all) {
        query1.skip((currentPage - 1) * perPage).take(perPage);
      }

      const qlistStore = await query1.getManyAndCount().catch((e) => {
        Logger.error(e.message, '', 'QueryListStore');
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [
                this.messageService.get('merchant.liststore.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

      const [storeItems, totalItems] = qlistStore;

      // -- Formating output OR add external attribute to  output--
      const formattedStoredItems = await Promise.all(
        storeItems.map(async (row) => {
          // Add 'distance_in_km' attribute
          const distance_in_km = getDistanceInKilometers(
            parseFloat(lat),
            parseFloat(long),
            row.location_latitude,
            row.location_longitude,
          );

          // Get relation of operational store & operational shift,
          const opt_hours = await this.storeOperationalService
            .getAllStoreScheduleByStoreId(row.id)
            .then((res) => {
              return res.map((e) => {
                const dayOfWeekToWord = DateTimeUtils.convertToDayOfWeek(
                  Number(e.day_of_week),
                );
                const x = new StoreOperationalHoursDocument({ ...e });
                delete x.day_of_week;
                return {
                  ...x,
                  day_of_week: dayOfWeekToWord,
                };
              });
            });

          // Parse Store Categories with localization category language name
          const store_categories = row.store_categories.map((item) => {
            const ctg_language = item.languages.find((e) => e.lang === lang);

            const x = new StoreCategoriesDocument({ ...item });
            delete x.languages;
            return { ...x, name: ctg_language.name };
          });

          // filter logic store operational status
          const store_operational_status = this.getStoreOperationalStatus(
            row.is_store_open,
            currTime,
            weekOfDay,
            row.operational_hours,
          );

          // Get Merchant Profile
          const merchant = await this.merchantRepository
            .findOne(row.merchant_id)
            .then((result) => {
              delete result.pic_password;
              delete result.approved_at;
              delete result.created_at;
              delete result.updated_at;
              delete result.deleted_at;
              return result;
            });

          return {
            ...row,
            distance_in_km: distance_in_km,
            store_operational_status,
            operational_hours: opt_hours,
            store_categories: store_categories,
            merchant,
          };
        }),
      );

      const list_result: ListResponse = {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: formattedStoredItems,
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        list_result,
      );
    } catch (e) {
      Logger.error(e.message, '', 'QUERY LIST STORE');
      throw e;
    }
  }

  private getStoreOperationalStatus(
    is_store_status: boolean,
    currTime: string,
    currWeekDay: number,
    curShiftHour: StoreOperationalHoursDocument[],
  ) {
    const isCurrentDay = curShiftHour.find(
      (row) => row.day_of_week == String(currWeekDay),
    );

    const respectShiftTime = isCurrentDay.shifts.find((e) =>
      currTime >= e.open_hour && currTime < e.close_hour ? true : false,
    );

    Logger.debug(
      `Get store_operational_status(store open: ${is_store_status} && in_operational_time ${respectShiftTime})`,
    );
    return is_store_status && respectShiftTime !== null ? true : false;
  }

  async listStoreCategories(
    data: Record<string, any>,
  ): Promise<RSuccessMessage> {
    // let search = data.search || '';
    // search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    let totalItems: number;
    const lang = data.lang || 'en';
    const listLang = ['en'];
    if (lang != 'en') {
      listLang.push(lang);
    }

    return await this.storeCategoryRepository
      .createQueryBuilder('sc')
      .where('sc.active = true')
      .orderBy('sc.created_at')
      .offset((currentPage - 1) * perPage)
      .limit(perPage)
      .getManyAndCount()
      .then(async (rescounts) => {
        totalItems = rescounts[1];
        const listStocat = [];
        rescounts[0].forEach((raw) => {
          listStocat.push(raw.id);
        });
        return await this.storeCategoryRepository
          .createQueryBuilder('sc')
          .leftJoinAndSelect(
            'sc.languages',
            'merchant_store_categories_languages',
          )
          .where('sc.active = true')
          .where('sc.id IN(:...lid)', { lid: listStocat })
          .orderBy('merchant_store_categories_languages.name')
          .getRawMany();
      })
      .then((result) => {
        const listManipulate = [];
        result.forEach((row) => {
          const idx = _.findIndex(listManipulate, function (ix: any) {
            return ix.id == row.sc_id;
          });
          if (idx == -1) {
            const manipulatedRow = {
              id: row.sc_id,
              image: row.sc_image,
              active: row.sc_active,
              name: row.merchant_store_categories_languages_name,
              created_at: row.sc_created_at,
              updated_at: row.sc_updated_at,
            };
            dbOutputTime(manipulatedRow);
            listManipulate.push(manipulatedRow);
          } else {
            if (row.merchant_store_categories_languages_lang == data.lang)
              listManipulate[idx].name =
                row.merchant_store_categories_languages_name;
          }
        });

        const listResult: ListResponse = {
          total_item: totalItems,
          limit: Number(perPage),
          current_page: Number(currentPage),
          items: listManipulate,
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

  async searchStoreMenu(
    data: QuerySearchValidation,
    user: any,
  ): Promise<RSuccessMessage> {
    try {
      const distance = 25;
      const store_category_id = null;
      const pickup = true;
      const is_24hrs = true;
      const include_closed_stores = true;
      const lang = data.lang ? data.lang : 'id';
      const price_range_id = null;
      const sort = 'distance';
      const order = 'asc';
      const new_this_week = false;
      const budget_meal = null;
      const page = data.page || 1;
      const limit = data.limit || 10;

      const options = {
        fetch_all: true,
      };

      const search =
        data.search === '' ? null : data.search ? data.search : null;

      const args: QueryListStoreDto = {
        ...data,
        distance,
        store_category_id,
        pickup,
        is_24hrs,
        include_closed_stores,
        price_range_id,
        sort,
        order,
        new_this_week,
        budget_meal,
        lang,
        search: null,
      };
      const listStores = await this.getListQueryStore(args, options);
      let stores_with_menus: any[] = [];

      if (listStores.data) {
        stores_with_menus = await Promise.all(
          listStores.data.items.map(async (store: any): Promise<number> => {
            const filter = new RegExp(`\\b${search}\\b`, 'i');
            const menu_item = await this.catalogsService.getMenuByStoreId(
              store.id,
            );
            store.menus = [];
            store.priority = 4;
            if (filter.test(store.name)) {
              store.priority = 2;
            }
            menu_item.data.items.category.forEach((cat: any) => {
              cat.menus.foreach((menu: any) => {
                if (filter.test(menu.name)) {
                  if (store.priority === 2) {
                    store.priority = 1;
                  } else {
                    store.priority = 3;
                  }
                  store.menus.push(menu);
                }
              });
            });

            return store;
          }),
        );
      }

      stores_with_menus = stores_with_menus.filter(
        (item) => item.priority !== 4,
      );

      stores_with_menus.sort(
        (a, b) =>
          a.priority * 100 +
          a.distance_in_km -
          (b.priority * 100 + b.distance_in_km),
      );

      listStores.data.total_item = stores_with_menus.length;

      listStores.data.items = stores_with_menus.slice(
        (page - 1) * limit,
        (page - 1) * limit + limit - 1,
      );

      if (user && listStores.data.items.length) {
        const historyKeyword: Partial<SearchHistoryKeywordDocument> = {
          customer_id: user.id,
          keyword: data.search,
          lang: lang,
        };
        await this.searchHistoryKeywordDocument.save(historyKeyword);

        if (listStores.data?.total_item) {
          const historyStore: Partial<SearchHistoryStoreDocument> = {
            store_id: stores_with_menus[0].id,
            customer_id: user.id,
            lang: lang,
          };

          await this.searchHistoryStoreDocument.save(historyStore);
        }
      }

      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        listStores,
      );
    } catch (e) {
      Logger.error(e.message, '', 'QUERY LIST STORE');
      throw e;
    }
  }

  async searchHistoriesKeywords(
    data: QuerySearchHistoryValidation,
  ): Promise<RSuccessMessage> {
    try {
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;

      const query = this.searchHistoryKeywordDocument
        .createQueryBuilder('qb')
        .select('DISTINCT qb.keyword', 'keyword')
        .addSelect('MAX(qb.created_at)', 'created_at')
        .groupBy('qb.keyword')
        .orderBy('created_at', 'DESC')
        .addOrderBy('qb.keyword')
        .skip((currentPage - 1) * perPage)
        .take(perPage);

      const counter = await this.searchHistoryKeywordDocument
        .createQueryBuilder('count')
        .select('COUNT(DISTINCT count.keyword)', 'count')
        .getRawOne();

      const items = await query.getRawMany();
      const count = counter?.count ? +counter.count : 0;

      const list_result: ListResponse = {
        total_item: count,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: items,
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        list_result,
      );
    } catch (e) {
      Logger.error(e.message, '', 'QUERY LIST STORE');
      throw e;
    }
  }

  async searchHistoriesStores(
    data: QuerySearchHistoryStoresValidation,
  ): Promise<RSuccessMessage> {
    try {
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;

      const lat = data.location_latitude;
      const long = data.location_longitude;
      const store_category_id = null;
      const search = null;
      const radius = 25;

      // data.pickup = false;
      // if (data.pickup) {
      //   delivery_only =
      //     data.pickup == true
      //       ? [
      //           enumDeliveryType.delivery_and_pickup,
      //           enumDeliveryType.pickup_only,
      //         ]
      //       : [enumDeliveryType.delivery_only];
      // } else {
      //   delivery_only = [
      //     enumDeliveryType.delivery_and_pickup,
      //     enumDeliveryType.pickup_only,
      //     enumDeliveryType.delivery_only,
      //   ];
      // }

      const delivery_only = [
        enumDeliveryType.delivery_and_pickup,
        enumDeliveryType.pickup_only,
        enumDeliveryType.delivery_only,
      ];
      const is24hrs = true;
      const open_24_hour = true;
      const include_closed_stores = true;

      const currTime = DateTimeUtils.DateTimeToUTC(new Date());
      const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
      const lang = 'id';

      const query = await this.searchHistoryStoreDocument
        .createQueryBuilder('qb')
        .select('DISTINCT qb.store_id', 'store_id')
        .addSelect('MAX(qb.created_at)', 'created_at')
        .groupBy('qb.store_id')
        .orderBy('created_at', 'DESC')
        .addOrderBy('qb.store_id')
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .getRawMany();

      const ids = query.map((item) => item.store_id);

      Logger.debug(
        `filter params:
        current time: ${currTime} UTC+0
        week of day: ${weekOfDay}
        is24hour: ${is24hrs}
        open_24_hour: ${open_24_hour}
        include_closed_stores: ${include_closed_stores}
        delivery_only: ${delivery_only}
      `,
        'Query List Stores',
      );

      const query2 = this.storeRepository
        .createQueryBuilder('merchant_store')
        .where('merchant_store.id IN (:...arr_id)', {
          arr_id: ids,
        })

        .addSelect(
          '(6371 * ACOS(COS(RADIANS(' +
            lat +
            ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
            long +
            ')) + SIN(RADIANS(' +
            lat +
            ')) * SIN(RADIANS(merchant_store.location_latitude))))',
          'distance_in_km',
        )
        // --- JOIN TABLES ---
        .leftJoinAndSelect(
          'catalogs_menu',
          'catalogs_menus',
          'catalogs_menus.merchant_id = merchant_store.merchant_id',
        )
        .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
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
        )
        // --- Filter Conditions ---
        // ${delivery_only ? `AND delivery_type = :delivery_only` : ''}

        .andWhere(
          `(6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(:long)) + SIN(RADIANS(:lat)) * SIN(RADIANS(merchant_store.location_latitude)))) <= :radius
            ${is24hrs ? `AND merchant_store.is_open_24h = :open_24_hour` : ''}
            ${delivery_only ? `AND delivery_type in (:...delivery_only)` : ''}
            ${
              store_category_id
                ? `AND merchant_store_categories.id = :stocat`
                : ''
            }`,
          {
            active: enumStoreStatus.active,
            open_24_hour: open_24_hour,
            delivery_only: delivery_only,
            stocat: store_category_id,
            radius: radius,
            lat: lat,
            long: long,
          },
        );
      // .andWhere(
      //   new Brackets((qb) => {
      //     if (include_closed_stores) {
      //       // Tampilkan semua stores, tanpa memperhatikan jadwal operasional store
      //       qb.where(`operational_hours.day_of_week = :weekOfDay`, {
      //         weekOfDay: weekOfDay,
      //       });
      //     } else {
      //       qb.where(
      //         `operational_hours.day_of_week = :weekOfDay
      //           AND merchant_store.is_store_open = :is_open
      //           AND operational_hours.merchant_store_id IS NOT NULL
      //         ${
      //           // jika params 'is24hrs' is 'false' / tidak di define, query list store include dgn store yg buka 24jam
      //           is24hrs
      //             ? `AND ((:currTime >= operational_shifts.open_hour AND :currTime < operational_shifts.close_hour) OR operational_hours.is_open_24h = :all24h)`
      //             : ''
      //         }`,
      //         {
      //           is_open: true,
      //           weekOfDay: weekOfDay,
      //           currTime: currTime,
      //           all24h: true, //niel true for query all stores
      //         },
      //       );
      //     }
      //   }),
      // );

      if (search) {
        query2.andWhere(
          new Brackets((qb) => {
            qb.where('merchant_store.name ilike :sname', {
              sname: '%' + search.toLowerCase() + '%',
            }).orWhere('catalogs_menus.name ilike :sname', {
              sname: '%' + search.toLowerCase() + '%',
            });
          }),
        );
      }

      query2
        .orderBy('distance_in_km', 'ASC')
        .skip((currentPage - 1) * perPage)
        .take(perPage);
      const qlistStore = await query2.getManyAndCount().catch((e) => {
        Logger.error(e.message, '', 'QueryListStore');
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [
                this.messageService.get('merchant.liststore.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

      // .getRawMany();

      const [storeItems, totalItems] = qlistStore;

      const formattedStoredItems = await Promise.all(
        storeItems.map(async (row: any) => {
          // Add 'distance_in_km' attribute
          const distance_in_km = getDistanceInKilometers(
            parseFloat(lat),
            parseFloat(long),
            row.location_latitude,
            row.location_longitude,
          );

          // Get relation of operational store & operational shift,
          const opt_hours = await this.storeOperationalService
            .getAllStoreScheduleByStoreId(row.id)
            .then((res) => {
              return res.map((e) => {
                const dayOfWeekToWord = DateTimeUtils.convertToDayOfWeek(
                  Number(e.day_of_week),
                );
                const x = new StoreOperationalHoursDocument({ ...e });
                delete x.day_of_week;
                return {
                  ...x,
                  day_of_week: dayOfWeekToWord,
                };
              });
            });

          // Parse Store Categories with localization category language name
          const store_categories = row.store_categories.map((item) => {
            const ctg_language = item.languages.find((e) => e.lang === lang);

            const x = new StoreCategoriesDocument({ ...item });
            delete x.languages;
            return { ...x, name: ctg_language.name };
          });

          // filter logic store operational status
          const store_operational_status = this.getStoreOperationalStatus(
            row.is_store_open,
            currTime,
            weekOfDay,
            row.operational_hours,
          );

          // Get Merchant Profile
          const merchant = await this.merchantRepository
            .findOne(row.merchant_id)
            .then((result) => {
              delete result.pic_password;
              delete result.approved_at;
              delete result.created_at;
              delete result.updated_at;
              delete result.deleted_at;
              return result;
            });

          // Get Menus
          const menus = row.catalogs_menus;

          return {
            ...row,
            distance_in_km: distance_in_km,
            store_operational_status,
            operational_hours: opt_hours,
            store_categories: store_categories,
            menus: menus,
            merchant,
          };
        }),
      );

      const list_result: ListResponse = {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: formattedStoredItems,
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        list_result,
      );
    } catch (e) {
      Logger.error(e.message, '', 'QUERY LIST STORE');
      throw e;
    }
  }

  async searchPopulars(
    data: QuerySearchHistoryValidation,
  ): Promise<RSuccessMessage> {
    try {
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;

      const raw = await this.searchHistoryKeywordDocument
        .createQueryBuilder('qb')
        .select('qb.keyword', 'keyword')
        .addSelect('COUNT(*)', 'count')
        .groupBy('qb.keyword')
        .orderBy('qb.count', 'DESC')
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .getRawMany();

      const items = raw.map((item) => {
        return {
          keyword: item.keyword,
        };
      });

      const counter = await this.searchHistoryKeywordDocument
        .createQueryBuilder('count')
        .select('COUNT(DISTINCT count.keyword)', 'count')
        .getRawOne();

      const list_result: ListResponse = {
        total_item: counter?.count ? +counter.count : 0,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: items,
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        list_result,
      );
    } catch (e) {
      Logger.error(e.message, '', 'QUERY LIST STORE');
      throw e;
    }
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

  async manipulateStoreDistance(result: any[]) {
    const stores = [];
    let number_store = 0;
    let store_id = '';
    let store = Object();
    result.forEach(async (raw) => {
      dbOutputTime(raw);

      if (store_id == '') {
        //jika foreach pertama
        store_id = raw.merchant_store_id; //maka inisiasi store id
      }
      if (store_id != raw.merchant_store_id) {
        //jika variabel store id tidak sama dengan store id result maka
        store = Object(); // kosongkan object store
        number_store += 1; // +1 menandakan store tidak sama
        store_id = raw.merchant_store_id; // rubah store id baru
      }

      store.id = raw.merchant_store_id;
      store.merchant_id = raw.merchant_store_merchant_id;
      store.name = raw.merchant_store_name;
      store.phone = raw.merchant_store_phone;
      store.owner_phone = raw.merchant_store_owner_phone;
      store.owner_email = raw.merchant_store_owner_email;
      store.address = raw.merchant_store_address;
      store.post_code = raw.merchant_store_post_code;
      store.guidance = raw.merchant_store_guidance;
      store.distance_in_km = raw.distance_in_km;
      store.location_longitude = parseFloat(
        raw.merchant_store_location_longitude,
      );
      store.location_latitude = parseFloat(
        raw.merchant_store_location_latitude,
      );
      store.upload_photo = raw.merchant_store_upload_photo;
      store.upload_banner = raw.merchant_store_upload_banner;
      store.delivery_type = raw.merchant_store_delivery_type;
      store.status = raw.merchant_store_status;
      store.is_store_open = raw.merchant_store_is_store_open;
      store.is_open_24h = raw.merchant_store_is_open_24h;
      store.created_at = raw.merchant_store_created_at;
      store.updated_at = raw.merchant_store_updated_at;
      store.deleted_at = raw.merchant_store_deleted_at;

      stores[number_store] = store;

      // Add service Addons
      if (!store.service_addon) {
        store.service_addon = [];
      }
      if (raw.merchant_addon_id) {
        const service_addon = Object();

        service_addon.id = raw.merchant_addon_id;
        service_addon.name = raw.merchant_addon_name;
        service_addon.deleted_at = raw.merchant_addon_deleted_at;

        const duplicate = this.cekDuplicate(
          stores[number_store].service_addon,
          service_addon.id,
        );
        if (!duplicate) {
          stores[number_store].service_addon.push(service_addon);
        }
      }

      // Add Store Operational Hours
      if (!store.operational_hours) {
        store.operational_hours = [];
      }
      if (raw.operational_hours_id) {
        const operational_hour = Object();

        operational_hour.id = raw.operational_hours_id;
        operational_hour.merchant_store_id =
          raw.operational_hours_merchant_store_id;
        operational_hour.day_of_week = raw.operational_hours_day_of_week;
        operational_hour.is_open = raw.operational_hours_is_open;
        operational_hour.is_open_24h = raw.operational_hours_is_open_24h;
        operational_hour.open_hour = raw.operational_hours_open_hour;
        operational_hour.close_hour = raw.operational_hours_close_hour;
        operational_hour.created_at = raw.operational_hours_created_at;
        operational_hour.updated_at = raw.operational_hours_updated_at;

        const duplicate = this.cekDuplicate(
          stores[number_store].operational_hours,
          operational_hour.id,
        );
        if (!duplicate) {
          stores[number_store].operational_hours.push(operational_hour);
        }
      } // End of Add Store Operational Hours

      // Add Store Categories
      if (!store.store_categories) {
        store.store_categories = [];
      }
      if (raw.merchant_store_categories_id) {
        const categories = Object();

        categories.id = raw.merchant_store_categories_id;
        categories.image = raw.merchant_store_categories_image;
        categories.name_id = raw.merchant_store_categories_name_id;
        categories.name_en = raw.merchant_store_categories_name_en;
        categories.active = raw.merchant_store_categories_active;
        categories.created_at = raw.merchant_store_categories_created_at;
        categories.updated_at = raw.merchant_store_categories_updated_at;
        categories.deleted_at = raw.merchant_store_categories_deleted_at;

        const duplicate = this.cekDuplicate(
          stores[number_store].store_categories,
          categories.id,
        );
        if (!duplicate) {
          stores[number_store].store_categories.push(categories);
        }
      } // End of Add Store Categories
    });
    return stores;
  } //end of manipulate Distance

  cekDuplicate(o2bject: any[], value: string) {
    let hasil = false;
    o2bject.forEach((object) => {
      if (object.id == value) {
        hasil = true;
        return hasil;
      }
    });
    return hasil;
  }

  async manipulateStoreDistance2(result: any[], lang: string) {
    const listManipulate = [];
    result.forEach((raw) => {
      const idx = _.findIndex(listManipulate, function (ix: any) {
        return ix.id == raw.merchant_store_id;
      });
      if (idx == -1) {
        const manipulatedRow = {
          id: raw.merchant_store_id,
          merchant_id: raw.merchant_store_merchant_id,
          name: raw.merchant_store_name,
          phone: raw.merchant_store_phone,
          owner_phone: raw.merchant_store_owner_phone,
          owner_email: raw.merchant_store_owner_email,
          address: raw.merchant_store_address,
          post_code: raw.merchant_store_post_code,
          guidance: raw.merchant_store_guidance,
          distance_in_km: raw.distance_in_km,
          location_longitude: parseFloat(raw.merchant_store_location_longitude),
          location_latitude: parseFloat(raw.merchant_store_location_latitude),
          upload_photo: raw.merchant_store_upload_photo,
          upload_banner: raw.merchant_store_upload_banner,
          delivery_type: raw.merchant_store_delivery_type,
          status: raw.merchant_store_status,
          is_store_open: raw.merchant_store_is_store_open,
          is_open_24h: raw.merchant_store_is_open_24h,
          created_at: raw.merchant_store_created_at,
          updated_at: raw.merchant_store_updated_at,
          deleted_at: raw.merchant_store_deleted_at,
          service_addon: [],
          operational_hours: [],
          store_categories: [],
        };
        if (raw.merchant_addon_id) {
          const addon = {
            id: raw.merchant_addon_id,
            name: raw.merchant_addon_name,
          };
          manipulatedRow.service_addon.push(addon);
        }
        if (raw.operational_hours_id) {
          const oh = {
            id: raw.operational_hours_id,
            merchant_store_id: raw.operational_hours_merchant_store_id,
            day_of_week: raw.operational_hours_day_of_week,
            is_open: raw.operational_hours_is_open,
            is_open_24h: raw.operational_hours_is_open_24h,
          };
          manipulatedRow.operational_hours.push(oh);
        }
        if (raw.merchant_store_categories_id) {
          const sc = {
            id: raw.merchant_store_categories_id,
            image: raw.merchant_store_categories_image,
            active: raw.merchant_store_categories_active,
            name: raw.merchant_store_categories_languages_name,
          };
          manipulatedRow.store_categories.push(sc);
        }

        dbOutputTime(manipulatedRow);
        listManipulate.push(manipulatedRow);
      } else {
        if (raw.merchant_addon_id) {
          const idy = _.findIndex(
            listManipulate[idx].service_addon,
            function (ix: any) {
              return ix.id == raw.merchant_addon_id;
            },
          );
          if (idy == -1) {
            const addon = {
              id: raw.merchant_addon_id,
              name: raw.merchant_addon_name,
            };
            listManipulate[idx].service_addon.push(addon);
          }
          if (raw.operational_hours_id) {
            const idz = _.findIndex(
              listManipulate[idx].operational_hours,
              function (ix: any) {
                return ix.id == raw.operational_hours_id;
              },
            );
            if (idz == -1) {
              const oh = {
                id: raw.operational_hours_id,
                merchant_store_id: raw.operational_hours_merchant_store_id,
                day_of_week: raw.operational_hours_day_of_week,
                is_open: raw.operational_hours_is_open,
                is_open_24h: raw.operational_hours_is_open_24h,
                open_hour: raw.operational_hours_open_hour,
                close_hour: raw.operational_hours_close_hour,
              };
              listManipulate[idx].operational_hours.push(oh);
            }
          }
          if (raw.merchant_store_categories_id) {
            const ida = _.findIndex(
              listManipulate[idx].store_categories,
              function (ix: any) {
                return ix.id == raw.merchant_store_categories_id;
              },
            );
            if (ida == -1) {
              const sc = {
                id: raw.merchant_store_categories_id,
                image: raw.merchant_store_categories_image,
                active: raw.merchant_store_categories_active,
                name: raw.merchant_store_categories_languages_name,
              };
              listManipulate[idx].store_categories.push(sc);
            } else {
              if (raw.merchant_store_categories_languages_lang == lang)
                listManipulate[idx].store_categories[ida].name =
                  raw.merchant_store_categories_languages_name;
            }
          }
        }
      }
    });
    return listManipulate;
  }

  async fetchStore(data: any): Promise<any> {
    try {
      const search =
        data.search === '' ? null : data.search ? data.search : null;
      const radius = data.distance || 25;
      const lat = data.location_latitude;
      const long = data.location_longitude;
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;
      const store_category_id: string = data.store_category_id || null;
      data.pickup = false;
      data.lang = data.lang ? data.lang : 'id';

      // ? [enumDeliveryType.delivery_and_pickup, enumDeliveryType.pickup_only]
      let delivery_only;
      if (data.pickup) {
        delivery_only =
          data.pickup == true
            ? [
                enumDeliveryType.delivery_and_pickup,
                enumDeliveryType.pickup_only,
              ]
            : [enumDeliveryType.delivery_only];
      } else {
        delivery_only = [
          enumDeliveryType.delivery_and_pickup,
          enumDeliveryType.pickup_only,
          enumDeliveryType.delivery_only,
        ];
      }
      const is24hrs = data?.is_24hrs ? true : false;
      const open_24_hour = data.is_24hrs ? true : false;
      const include_closed_stores = data.include_closed_stores || true;

      const currTime = DateTimeUtils.DateTimeToUTC(new Date());
      const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
      const lang = data.lang || 'id';

      Logger.debug(
        `filter params:
        current time: ${currTime} UTC+0
        week of day: ${weekOfDay}
        is24hour: ${is24hrs}
        open_24_hour: ${open_24_hour}
        include_closed_stores: ${include_closed_stores}
        delivery_only: ${delivery_only}
      `,
        'Query List Stores',
      );

      const query1 = this.storeRepository
        .createQueryBuilder('merchant_store')
        .addSelect(
          '(6371 * ACOS(COS(RADIANS(' +
            lat +
            ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
            long +
            ')) + SIN(RADIANS(' +
            lat +
            ')) * SIN(RADIANS(merchant_store.location_latitude))))',
          'distance_in_km',
        )
        // --- JOIN TABLES ---
        .leftJoinAndSelect(
          'catalogs_menu_store_availability',
          'catalogs_menu_store_availability',
          'catalogs_menu_store_availability.store_id = merchant_store.id',
        )
        .leftJoinAndSelect(
          'catalogs_menu_price',
          'catalogs_menu_price',
          'catalogs_menu_price.id = catalogs_menu_store_availability.menu_price_id',
        )
        .leftJoinAndSelect(
          'catalogs_menu',
          'catalogs_menu',
          'catalogs_menu.id = catalogs_menu_price.menu_id',
        )
        .addSelect('catalogs_menu.id', 'menu_ids')
        .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon') //MANY TO MANY
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
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
        )
        // --- Filter Conditions ---
        // ${delivery_only ? `AND delivery_type = :delivery_only` : ''}

        .where(
          `(6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(:long)) + SIN(RADIANS(:lat)) * SIN(RADIANS(merchant_store.location_latitude)))) <= :radius
            ${is24hrs ? `AND merchant_store.is_open_24h = :open_24_hour` : ''}
            ${delivery_only ? `AND delivery_type in (:...delivery_only)` : ''}
            ${
              store_category_id
                ? `AND merchant_store_categories.id = :stocat`
                : ''
            }`,
          {
            active: enumStoreStatus.active,
            open_24_hour: open_24_hour,
            delivery_only: delivery_only,
            stocat: store_category_id,
            radius: radius,
            lat: lat,
            long: long,
          },
        );
      // .andWhere(
      //   new Brackets((qb) => {
      //     if (include_closed_stores) {
      //       // Tampilkan semua stores, tanpa memperhatikan jadwal operasional store
      //       qb.where(`operational_hours.day_of_week = :weekOfDay`, {
      //         weekOfDay: weekOfDay,
      //       });
      //     } else {
      //       qb.where(
      //         `operational_hours.day_of_week = :weekOfDay
      //           AND merchant_store.is_store_open = :is_open
      //           AND operational_hours.merchant_store_id IS NOT NULL
      //         ${
      //           // jika params 'is24hrs' is 'false' / tidak di define, query list store include dgn store yg buka 24jam
      //           is24hrs == false
      //             ? `AND ((:currTime >= operational_shifts.open_hour AND :currTime < operational_shifts.close_hour) OR operational_hours.is_open_24h = :all24h)`
      //             : ''
      //         }`,
      //         {
      //           is_open: true,
      //           weekOfDay: weekOfDay,
      //           currTime: currTime,
      //           all24h: true, //niel true for query all stores
      //         },
      //       );
      //     }
      //   }),
      // );

      if (search) {
        query1
          .andWhere(
            new Brackets((qb) => {
              qb.where('merchant_store.name ilike :sname', {
                sname: '%' + search + '%',
              }).orWhere('catalogs_menu.name ilike :sname', {
                sname: '%' + search + '%',
              });
            }),
          )

          .addSelect(
            `CASE
              WHEN "merchant_store"."name" ILIKE '${
                '%' + search.toLowerCase() + '%'
              }' 
              AND catalogs_menu.name  ILIKE '${
                '%' + search.toLowerCase() + '%'
              }' THEN '1'
              WHEN "merchant_store"."name" ILIKE '${
                '%' + search.toLowerCase() + '%'
              }' THEN '2'
              WHEN catalogs_menu.name ILIKE '${
                '%' + search.toLowerCase() + '%'
              }' THEN '3'
              ELSE '4'
          END`,
            'priority',
          );

        // .addSelect(
        //   `CASE
        //     WHEN "merchant_store"."name" ILIKE '${
        //       '%' + search.toLowerCase() + '%'
        //     }' THEN '1'
        //     ELSE '4'
        // END`,
        //   'priority',
        // );

        // .addSelect(
        //   `CASE
        //   WHEN catalogs_menu.name  ILIKE '${
        //     '%' + search.toLowerCase() + '%'
        //   }' THEN '3'
        //     ELSE '4'
        // END`,
        //   'priority',
        // );
      }

      query1
        .orderBy('priority', 'ASC')
        .addOrderBy('distance_in_km', 'ASC')
        .skip((currentPage - 1) * perPage)
        .take(perPage);
      const qlistStore = await query1.getManyAndCount().catch((e) => {
        Logger.error(e.message, '', 'QueryListStore');
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [
                this.messageService.get('merchant.liststore.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });

      const [storeItems, totalItems] = qlistStore;

      // -- Formating output OR add external attribute to  output--
      const formattedStoredItems = await Promise.all(
        storeItems.map(async (row: any) => {
          // Add 'distance_in_km' attribute
          const distance_in_km = getDistanceInKilometers(
            parseFloat(lat),
            parseFloat(long),
            row.location_latitude,
            row.location_longitude,
          );

          // Get relation of operational store & operational shift,
          const opt_hours = await this.storeOperationalService
            .getAllStoreScheduleByStoreId(row.id)
            .then((res) => {
              return res.map((e) => {
                const dayOfWeekToWord = DateTimeUtils.convertToDayOfWeek(
                  Number(e.day_of_week),
                );
                const x = new StoreOperationalHoursDocument({ ...e });
                delete x.day_of_week;
                return {
                  ...x,
                  day_of_week: dayOfWeekToWord,
                };
              });
            });

          // Parse Store Categories with localization category language name
          const store_categories = row.store_categories.map((item) => {
            const ctg_language = item.languages.find((e) => e.lang === lang);

            const x = new StoreCategoriesDocument({ ...item });
            delete x.languages;
            return { ...x, name: ctg_language.name };
          });

          // filter logic store operational status
          const store_operational_status = this.getStoreOperationalStatus(
            row.is_store_open,
            currTime,
            weekOfDay,
            row.operational_hours,
          );

          // Get Merchant Profile
          const merchant = await this.merchantRepository
            .findOne(row.merchant_id)
            .then((result) => {
              delete result.pic_password;
              delete result.approved_at;
              delete result.created_at;
              delete result.updated_at;
              delete result.deleted_at;
              return result;
            });

          const menu_item = await this.catalogsService.getMenuByStoreId(row.id);

          return {
            ...row,
            distance_in_km: distance_in_km,
            store_operational_status,
            operational_hours: opt_hours,
            store_categories: store_categories,
            menus: menu_item.data.items,
            merchant,
          };
        }),
      );

      const list_result: ListResponse = {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: formattedStoredItems,
      };

      return list_result;
    } catch (e) {
      Logger.error(e.message, '', 'QUERY LIST STORE');
      throw e;
    }
  }

  async getPriceRange(): Promise<RSuccessMessage> {
    return this.priceRangeService.listPriceRange({ limit: '999' });
  }
}
