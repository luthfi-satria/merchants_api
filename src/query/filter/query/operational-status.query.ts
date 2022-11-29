import { FilterQueryInterface } from '../helper/interface/filter-query.interface';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { StoreDocument } from '../../../database/entities/store.entity';
import { DateTimeUtils } from '../../../utils/date-time-utils';

export class OperationalStatusQuery implements FilterQueryInterface {
  constructor(
    public query: SelectQueryBuilder<StoreDocument>,
    public includeClosedStore: any,
    public isOpen24h: any,
    public weekOfDay: any = null,
    public currTime: any = null,
  ) {
    this.currTime = DateTimeUtils.DateTimeToUTC(new Date());

    this.weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
  }

  public getQuery(): SelectQueryBuilder<any> {
    this.query.andWhere(
      new Brackets((qb) => {
        if (this.includeClosedStore) {
          // Tampilkan semua stores, tanpa memperhatikan jadwal operasional store
          qb.where(`operational_hours.day_of_week = :weekOfDay`, {
            weekOfDay: this.weekOfDay,
          });
        } else {
          qb.where(
            `operational_hours.day_of_week = :weekOfDay
              AND merchant_store.is_store_open = :is_open
              AND operational_hours.merchant_store_id IS NOT NULL
              AND operational_hours.is_open = :isOpenOperational
            ${
              // jika params 'is24hrs' is 'false' / tidak di define, query list store include dgn store yg buka 24jam
              !this.isOpen24h
                ? `AND (((:currTime >= operational_shifts.open_hour AND :currTime < operational_shifts.close_hour) OR (operational_shifts.open_hour > operational_shifts.close_hour AND ((operational_shifts.open_hour > :currTime AND operational_shifts.close_hour > :currTime) OR (operational_shifts.open_hour < :currTime AND operational_shifts.close_hour < :currTime)) )) OR operational_hours.is_open_24h = :all24h)`
                : ''
            }`,
            {
              is_open: true,
              weekOfDay: this.weekOfDay,
              currTime: this.currTime,
              all24h: true, //niel true for query all stores
              isOpenOperational: true,
            },
          );
        }
      }),
    );

    return this.query;
  }
}
