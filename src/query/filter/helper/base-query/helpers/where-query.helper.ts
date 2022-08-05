import { SelectQueryBuilder } from 'typeorm';
import * as _ from 'lodash';

export class WhereQueryHelper {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected moduleName: string,
    protected columnName: string,
    protected value: string | boolean | number,
    protected valueAliases: string,
  ) {}

  getQuery(): SelectQueryBuilder<any> {
    if (_.isEmpty(this.value)) {
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
