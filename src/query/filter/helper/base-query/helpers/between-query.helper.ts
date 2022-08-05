import { SelectQueryBuilder } from 'typeorm';
import { FilterQueryInterface } from '../../interface/filter-query.interface';

export class BetweenQueryHelper implements FilterQueryInterface {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected moduleName: string,
    protected columnName: string,
    protected from: string,
    protected to: string,
    protected valueAlias: string,
  ) {}

  getQuery(): SelectQueryBuilder<any> {
    if (!this.from || !this.to) {
      return this.baseQuery;
    }

    return this.baseQuery.andWhere(
      `${this.moduleName}.${this.columnName} BETWEEN :from${this.valueAlias} AND :to${this.valueAlias}`,
      {
        [`from${this.valueAlias}`]: this.from,
        [`to${this.valueAlias}`]: this.to,
      },
    );
  }
}
