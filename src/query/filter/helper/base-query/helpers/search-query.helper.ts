import { SelectQueryBuilder } from 'typeorm';
import { FilterQueryInterface } from '../../interface/filter-query.interface';

export class SearchQueryHelper implements FilterQueryInterface {
  constructor(
    protected baseQuery: SelectQueryBuilder<any> = null,
    protected moduleName: string,
    protected columnName: string,
    protected value: string,
    protected valueAliases: string,
  ) {}

  setBaseQuery(qb: any): this {
    this.baseQuery = qb;

    return this;
  }

  getQuery(): SelectQueryBuilder<any> {
    if (!this.value) {
      return this.baseQuery;
    }

    return this.baseQuery.orWhere(
      `${this.moduleName}.${this.columnName} ILIKE :${this.valueAliases}`,
      {
        [this.valueAliases]: `%${this.value}%`,
      },
    );
  }
}
