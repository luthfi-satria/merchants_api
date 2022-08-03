import { Brackets, SelectQueryBuilder } from 'typeorm';

export class WhereInJsonQueryHelper {
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
      new Brackets((qb) => {
        this.values.map((value, index) => {
          qb.orWhere(
            `${this.moduleName}.${this.columnName} = :${this.valueAliases}${index}`,
            {
              [`${this.valueAliases}${index}`]: value,
            },
          );
        });
      }),
    );
  }
}
