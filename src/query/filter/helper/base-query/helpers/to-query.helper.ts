import { SelectQueryBuilder } from 'typeorm';
import { FilterQueryInterface } from '../../interface/filter-query.interface';

export class ToQueryHelper implements FilterQueryInterface {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected moduleName: string,
    protected columnName: string,
    protected value: string | number,
    protected valueAlias: string,
  ) {}

  getQuery(): SelectQueryBuilder<any> {
    if (!this.value) {
      return this.baseQuery;
    }

    return this.baseQuery.andWhere(
      `${this.moduleName}.${this.columnName} <= ${this.value}`,
      {
        [this.valueAlias]: this.value,
      },
    );
  }
}
