import { SelectQueryBuilder } from 'typeorm';
import { FilterQueryInterface } from './interface/filter-query.interface';

export class FilterHelper {
  public queries: FilterQueryInterface[] = [];

  constructor(
    public baseQuery: SelectQueryBuilder<any>,
    public moduleName: string,
  ) {}

  setQueries(queryClass: FilterQueryInterface[]): FilterHelper {
    this.queries = queryClass;

    return this;
  }

  apply(): SelectQueryBuilder<any> {
    this.queries.forEach((query) => {
      this.baseQuery = query.getQuery();
    });

    return this.baseQuery;
  }

  orderBy(columns: string[], order: any) {
    columns.forEach((column) => {
      this.baseQuery.addOrderBy(column, order);
    });
  }
}
