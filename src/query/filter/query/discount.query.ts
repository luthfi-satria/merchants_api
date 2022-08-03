import { FilterQueryInterface } from '../helper/interface/filter-query.interface';
import { SelectQueryBuilder } from 'typeorm';
import { StoreDocument } from '../../../database/entities/store.entity';

export class DiscountQuery implements FilterQueryInterface {
  constructor(
    public query: SelectQueryBuilder<StoreDocument>,
    public moduleName: string,
    public promo: string,
  ) {}

  public getQuery(): SelectQueryBuilder<any> {
    if (!this.promo) {
      return this.query;
    }

    switch (this.promo) {
      case 'DISKON_BUAT_KAMU':
        this.query.andWhere('merchant.recommended_promo_type is not null');
        break;
      case 'PROMO_SPESIAL':
        this.query.andWhere(
          'merchant.recommended_shopping_discount_type is not null',
        );
        break;
      case 'HEMAT_ONGKIR':
        this.query.andWhere(
          'merchant.recommended_delivery_discount_type is not null',
        );
        break;
      case 'DISKON_MENU':
        this.query.andWhere(`${this.moduleName}.numdiscounts > 0`);
        break;
    }

    return this.query;
  }
}
