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
import { AddonsService } from 'src/addons/addons.service';
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
import { dbOutputTime, getDistanceInKilometers } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { QueryListStoreDto } from './validation/query-public.dto';
import _ from 'lodash';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoryRepository: Repository<StoreCategoriesDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly addonService: AddonsService,
    private readonly storeOperationalService: StoreOperationalService,
    private httpService: HttpService,
    private readonly merchantService: MerchantsService,
    @Hash() private readonly hashService: HashService,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
  ) {}

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

    const delivery_only =
      data.pickup == true
        ? [enumDeliveryType.delivery_and_pickup,enumDeliveryType.pickup_only]
        : [enumDeliveryType.delivery_only];
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
      .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon') //MANY TO MANY
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
        ${delivery_only.map((data,index)=>{
          if(index === 0){
            return `AND delivery_type = ${data}`
          }
          return `OR delivery_type = ${data}`
        })}
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
    const qListData = await this.storeRepository
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
      .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon') //MANY TO MANY
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

  async getListQueryStore(data: QueryListStoreDto): Promise<RSuccessMessage> {
    try {
      const search = data.search || '';
      const radius = data.distance || 25;
      const lat = data.location_latitude;
      const long = data.location_longitude;
      // search = search.toLowerCase();
      const currentPage = data.page || 1;
      const perPage = Number(data.limit) || 10;
      const store_category_id: string = data.store_category_id || null;

      // ? [enumDeliveryType.delivery_and_pickup, enumDeliveryType.pickup_only]
      const delivery_only =
      data.pickup == true
        ? [enumDeliveryType.delivery_and_pickup,enumDeliveryType.pickup_only]
        : [enumDeliveryType.delivery_only];
      const is24hrs = data?.is_24hrs ? true : false;
      const open_24_hour = data.is_24hrs;
      const include_closed_stores = data.include_closed_stores || false;

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

      const qlistStore = await this.storeRepository
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
        .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon') //MANY TO MANY
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
            ${delivery_only.map((data,index)=>{
              if(index === 0){
                return `AND delivery_type = ${data}`
              }
              return `OR delivery_type = ${data}`
            })}
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
                ${
                  // jika params 'is24hrs' false / tidak di define query list store include store yg buka 24jam
                  is24hrs == false
                    ? `AND ((:currTime >= operational_shifts.open_hour AND :currTime < operational_shifts.close_hour) OR merchant_store.is_open_24h = :all24h)`
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
        .orderBy('distance_in_km', 'ASC')
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .getManyAndCount()
        .catch((e) => {
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
    lang != 'en' ? listLang.push(lang) : '';

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
}
