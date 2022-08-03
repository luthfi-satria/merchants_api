import { FilterQueryInterface } from '../helper/interface/filter-query.interface';
import { SelectQueryBuilder } from 'typeorm';
import { StoreDocument } from '../../../database/entities/store.entity';

export class PriceQuery implements FilterQueryInterface {
  constructor(
    public query: SelectQueryBuilder<StoreDocument>,
    public moduleName: string,
    public isFilterPrice: boolean,
    public priceLow: any,
    public priceHigh: any,
  ) {}

  public getQuery(): SelectQueryBuilder<any> {
    if (!this.isFilterPrice) {
      return this.query;
    }

    this.query.andWhere(`${this.moduleName}.price >= :priceLow`, {
      priceLow: this.priceLow,
    });

    if (!this.priceHigh.includes(0)) {
      this.query.andWhere(`${this.moduleName}.price <= :priceHigh`, {
        priceHigh: this.priceHigh,
      });
    }

    return this.query;
  }
}
