import { QueryListStoreDto } from '../validation/query-public.dto';
import { SelectQueryBuilder } from 'typeorm';
import {
  enumDeliveryType,
  enumStoreStatus,
  StoreDocument,
} from '../../database/entities/store.entity';
import { FilterHelper } from './helper/filter.helper';
import { QueryBunlderHelper } from './helper/base-query/helpers/query-bunlder.helper';
import { WhereQueryHelper } from './helper/base-query/helpers/where-query.helper';
// import { OrWhereQueryHelper } from './helper/base-query/helpers/or-where-query.helper';
import { LocationQuery } from './query/location.query';
import { SettingsService } from '../../settings/settings.service';
import { WhereInQueryHelper } from './helper/base-query/helpers/where-in-query.helper';
import { OrdersService } from '../../common/orders/orders.service';
import { WhereBooleanQueryHelper } from './helper/base-query/helpers/where-boolean-query.helper';
import { ToQueryHelper } from './helper/base-query/helpers/to-query.helper';
import { FromQueryHelper } from './helper/base-query/helpers/from-query.helper';
import { DateTimeUtils } from '../../utils/date-time-utils';
import moment from 'moment';
import { PriceQuery } from './query/price.query';
import { SearchQueryHelper } from './helper/base-query/helpers/search-query.helper';
import { DiscountQuery } from './query/discount.query';
import { OperationalStatusQuery } from './query/operational-status.query';
import { BetweenQueryHelper } from './helper/base-query/helpers/between-query.helper';

export class GetStoreFilter {
  protected moduleName = 'merchant_store';

  constructor(
    public params: QueryListStoreDto,
    public settingService: SettingsService,
    public orderService: OrdersService,
    public priceParam: any,
  ) {}

  async apply(
    query: SelectQueryBuilder<StoreDocument>,
  ): Promise<SelectQueryBuilder<StoreDocument>> {
    query = this.getJoin(query);

    const filter: FilterHelper = new FilterHelper(query, this.moduleName);

    const settingRadius = await this.settingService.findByName('store_radius');

    const favoriteStoreIds = this.params.favorite_this_week
      ? await this.getFavoriteStoreIds()
      : [];

    //** DATE EXRACT NEXT*/
    const day = new Date();
    day.setDate(day.getDate() + 1);
    const dateNext = ('0' + day.getDate()).slice(-2);
    const monthNext = ('0' + (day.getMonth() + 1)).slice(-2);
    const yearNext = day.getFullYear();
    const nextDay = yearNext + '-' + monthNext + '-' + dateNext;

    //** DATE EXTRACT CURRENT */
    const currents = new Date();
    const date = ('0' + currents.getDate()).slice(-2);
    const month = ('0' + (currents.getMonth() + 1)).slice(-2);
    const year = currents.getFullYear();
    const currentDates = year + '-' + month + '-' + date;
    const startDates = DateTimeUtils.getNewThisWeekDates(currentDates);

    const queries: any[] = [
      new WhereQueryHelper(
        query,
        'merchant_store_categories',
        'id',
        this.params.store_category_id,
        'storeCategoryId',
      ),
      new WhereInQueryHelper(
        query,
        this.moduleName,
        'status',
        this.params.include_inactive_stores
          ? [enumStoreStatus.active, enumStoreStatus.inactive]
          : [enumStoreStatus.active],
        'statuses',
      ),
      new LocationQuery(
        query,
        this.params.distance || Number(settingRadius.value),
        this.params.location_latitude,
        this.params.location_longitude,
      ),
      new WhereInQueryHelper(
        query,
        this.moduleName,
        'id',
        favoriteStoreIds,
        'favoriteStoreIds',
      ),
      new WhereBooleanQueryHelper(
        query,
        this.moduleName,
        'is_open_24h',
        this.params.is_24hrs,
        'open24h',
      ),
      new WhereInQueryHelper(
        query,
        this.moduleName,
        'delivery_type',
        this.params.pickup
          ? [enumDeliveryType.delivery_and_pickup, enumDeliveryType.pickup_only]
          : [
              enumDeliveryType.delivery_and_pickup,
              enumDeliveryType.pickup_only,
              enumDeliveryType.delivery_only,
            ],
        'deliveryTypes',
      ),
      new WhereQueryHelper(
        query,
        this.moduleName,
        'merchant_id',
        this.params.merchant_id,
        'merchantId',
      ),
      new ToQueryHelper(
        query,
        this.moduleName,
        'average_price',
        this.priceParam.isBudgetEnable ? this.priceParam.budgetMaxValue : null,
        'budgetMax',
      ),
      new FromQueryHelper(
        query,
        this.moduleName,
        'approved_at',
        this.params.new_this_week ? `'${startDates}'` : null,
        'newThisWeekFrom',
      ),
      new ToQueryHelper(
        query,
        this.moduleName,
        'approved_at',
        this.params.new_this_week ? `'${nextDay}'` : null,
        'newThisWeekTo',
      ),
      new FromQueryHelper(
        query,
        this.moduleName,
        'rating',
        this.params.minimum_rating,
        'minimumRating',
      ),
      new PriceQuery(
        query,
        this.moduleName,
        this.priceParam.is_filter_price,
        this.priceParam.price_range_filter,
      ),
      new DiscountQuery(query, this.moduleName, this.params.promo),
      new OperationalStatusQuery(
        query,
        this.params.include_closed_stores,
        this.params.is_24hrs,
      ),
    ];

    if (this.params.search) {
      queries.push(
        new QueryBunlderHelper(query, [
          new SearchQueryHelper(
            query,
            this.moduleName,
            'name',
            this.params.search,
            'searchKey',
          ),
          new SearchQueryHelper(
            query,
            'menus',
            'name',
            this.params.search,
            'searchKey',
          ),
        ]),
      );
    }

    filter.setQueries(queries);

    return filter.apply();
  }

  getJoin(
    query: SelectQueryBuilder<StoreDocument>,
  ): SelectQueryBuilder<StoreDocument> {
    return (
      query
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
          'operational_hours.id',
          'operational_hours.day_of_week',
          'operational_hours.is_open',
          'operational_hours.is_open_24h',
          'merchant.id',
          'merchant.profile_store_photo',
          'merchant.recommended_promo_type',
          'merchant.recommended_discount_type',
          'merchant.recommended_discount_value',
          'merchant.recommended_shopping_discount_type',
          'merchant.recommended_shopping_discount_value',
          'merchant.recommended_delivery_discount_type',
          'merchant.recommended_delivery_discount_value',
          'operational_shifts.id',
          'operational_shifts.open_hour',
          'operational_shifts.close_hour',
          'merchant_store_categories.id',
          'merchant_store_categories_languages.id',
          'merchant_store_categories_languages.lang',
          'merchant_store_categories_languages.name',
        ])
        .addSelect(
          '(6371 * ACOS(COS(RADIANS(' +
            this.params.location_latitude +
            ')) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(' +
            this.params.location_longitude +
            ')) + SIN(RADIANS(' +
            this.params.location_latitude +
            ')) * SIN(RADIANS(merchant_store.location_latitude))))',
          'distance_in_km',
        )
        // .leftJoinAndSelect('merchant_store.service_addons', 'merchant_addon')
        .leftJoin(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
        .leftJoin('merchant_store.merchant', 'merchant')
        .leftJoin(
          'operational_hours.shifts',
          'operational_shifts',
          'operational_shifts.store_operational_id = operational_hours.id',
        )
        .leftJoin(
          'merchant_store.store_categories',
          'merchant_store_categories',
        )
        .leftJoin(
          'merchant_store_categories.languages',
          'merchant_store_categories_languages',
        )
        .leftJoin('merchant_store.menus', 'menus')
    );
  }

  async getFavoriteStoreIds() {
    const favoriteStore = await this.orderService.getFavoriteStoreThisWeek();

    return favoriteStore?.map((store) => store.store_id);
  }
}
