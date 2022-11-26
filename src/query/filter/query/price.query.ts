import { FilterQueryInterface } from '../helper/interface/filter-query.interface';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { StoreDocument } from '../../../database/entities/store.entity';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';

export class PriceQuery implements FilterQueryInterface {
  constructor(
    public query: SelectQueryBuilder<StoreDocument>,
    public moduleName: string,
    public isFilterPrice: boolean,
    public priceRangeFilter: PriceRangeDocument[],
  ) {}

  public getQuery(): SelectQueryBuilder<any> {
    if (!this.priceRangeFilter || this.priceRangeFilter?.length == 0) {
      return this.query;
    }

    console.log('PRICE RANGE FILTER', this.priceRangeFilter);

    this.query.andWhere(
      new Brackets((qb) => {
        // qb.where(
        //   `( ${this.moduleName}.average_price >= :priceLow AND ${this.moduleName}.average_price >= :priceHigh)`,
        //   {
        //     priceLow: this.priceRangeFilter[0].price_low,
        //     priceHigh: this.priceRangeFilter[0].price_high,
        //   },
        // );

        this.priceRangeFilter.forEach((priceRange, index) => {
          console.log('CURRENT PRICE RANGE FILTER', priceRange);

          if (index > 0) {
            qb.orWhere(
              `( ${this.moduleName}.average_price >= :priceLow${index} AND ${this.moduleName}.average_price <= :priceHigh${index})`,
              {
                ['priceLow']: priceRange.price_low,
                ['priceHigh']: priceRange.price_high,
              },
            );
          } else {
            qb.where(
              `( ${this.moduleName}.average_price >= :priceLow${index} AND ${this.moduleName}.average_price <= :priceHigh${index})`,
              {
                ['priceLow' + index]: priceRange.price_low,
                ['priceHigh' + index]: priceRange.price_high,
              },
            );
          }
        });

        // for (let i = 0; i < this.priceRangeFilter.length; i++) {
        //   const priceRange = this.priceRangeFilter[i];
        //   qb.orWhere(
        //     `( ${this.moduleName}.average_price >= ${priceRange.price_low} AND ${this.moduleName}.average_price >= ${priceRange.price_high})`,
        //   );
        // }
      }),
    );

    return this.query;
  }
}
