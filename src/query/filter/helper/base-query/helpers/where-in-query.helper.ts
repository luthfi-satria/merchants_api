import { SelectQueryBuilder } from 'typeorm';

export class WhereInQueryHelper {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected moduleName: string,
    protected columnName: string,
    protected values: string[],
    protected valueAliases: string,
  ) {}

  getQuery(): SelectQueryBuilder<any> {
    if (!(this.values?.length > 0)) {
      return this.baseQuery;
    }

    return this.baseQuery.andWhere(
      `${this.moduleName}.${this.columnName} IN (:...${this.valueAliases})`,
      {
        [this.valueAliases]: this.values,
      },
    );
  }
}
