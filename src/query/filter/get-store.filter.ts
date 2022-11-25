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

export class GetStoreFilter {
  protected moduleName = 'model';

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

    //** DATE EXRACT */
    const defaultData = new Date();
    const date = ('0' + defaultData.getDate()).slice(-2);
    const month = ('0' + (defaultData.getMonth() + 1)).slice(-2);
    const year = defaultData.getFullYear();
    const currentDates = year + '-' + month + '-' + date;
    const startDates = DateTimeUtils.getNewThisWeekDatse(currentDates);

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
        this.params.new_this_week ? `'${currentDates}'` : null,
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
        this.priceParam.priceLow,
        this.priceParam.priceHigh,
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
          'model.id',
          'model.name',
          'model.location_longitude',
          'model.location_latitude',
          'model.average_price',
          'model.platform',
          'model.photo',
          'model.banner',
          'model.rating',
          'model.numrating',
          'model.status',
          'operational_hours.id',
          'operational_hours.day_of_week',
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
            ')) * COS(RADIANS(model.location_latitude)) * COS(RADIANS(model.location_longitude) - RADIANS(' +
            this.params.location_longitude +
            ')) + SIN(RADIANS(' +
            this.params.location_latitude +
            ')) * SIN(RADIANS(model.location_latitude))))',
          'distance_in_km',
        )
        // .leftJoinAndSelect('model.service_addons', 'merchant_addon')
        .leftJoin(
          'model.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = model.id',
        )
        .leftJoin('model.merchant', 'merchant')
        .leftJoin(
          'operational_hours.shifts',
          'operational_shifts',
          'operational_shifts.store_operational_id = operational_hours.id',
        )
        .leftJoin('model.store_categories', 'merchant_store_categories')
        .leftJoin(
          'merchant_store_categories.languages',
          'merchant_store_categories_languages',
        )
        .leftJoin('model.menus', 'menus')
    );
  }

  async getFavoriteStoreIds() {
    const favoriteStore = await this.orderService.getFavoriteStoreThisWeek();

    return favoriteStore?.map((store) => store.store_id);
  }
}
