import { FilterQueryInterface } from '../helper/interface/filter-query.interface';
import { SelectQueryBuilder } from 'typeorm';
import { StoreDocument } from '../../../database/entities/store.entity';

export class LocationQuery implements FilterQueryInterface {
  constructor(
    public query: SelectQueryBuilder<StoreDocument>,
    public radius: any,
    public lat: any,
    public long: any,
  ) {}

  public getQuery(): SelectQueryBuilder<any> {
    return this.query.andWhere(
      '(6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(model.location_latitude)) * COS(RADIANS(model.location_longitude) - RADIANS(:long)) + SIN(RADIANS(:lat)) * SIN(RADIANS(model.location_latitude)))) <= :radius',
      {
        radius: this.radius,
        lat: this.lat,
        long: this.long,
      },
    );
  }
}
