import { SelectQueryBuilder } from 'typeorm';

export class OrWhereQueryHelper {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected moduleName: string,
    protected columnName: string,
    protected value: string,
    protected valueAliases: string,
  ) {}

  getQuery(): SelectQueryBuilder<any> {
    if (!this.value) {
      return this.baseQuery;
    }

    return this.baseQuery.orWhere(
      `${this.moduleName}.${this.columnName} = :${this.valueAliases}`,
      {
        [this.valueAliases]: this.value,
      },
    );
  }
}
