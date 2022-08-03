import { FilterQueryInterface } from '../../interface/filter-query.interface';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export class QueryBunlderHelper {
  constructor(
    protected baseQuery: SelectQueryBuilder<any>,
    protected filterQueries: FilterQueryInterface[],
  ) {}

  getQuery() {
    return this.baseQuery.andWhere(
      new Brackets((qb) => {
        this.filterQueries.forEach((query) => {
          query.setBaseQuery(qb).getQuery();
        });
      }),
    );
  }
}
