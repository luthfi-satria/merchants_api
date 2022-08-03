import { SelectQueryBuilder } from 'typeorm';

export class WhereBooleanQueryHelper {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected moduleName: string,
    protected columnName: string,
    protected value: string | number | boolean,
    protected valueAliases: string,
  ) {}

  getQuery(): SelectQueryBuilder<any> {
    if (!this.value) {
      return this.baseQuery;
    }

    return this.baseQuery.andWhere(
      `${this.moduleName}.${this.columnName} = :${this.valueAliases}`,
      {
        [this.valueAliases]: this.value,
      },
    );
  }
}
