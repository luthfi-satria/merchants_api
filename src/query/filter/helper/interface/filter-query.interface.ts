import { SelectQueryBuilder } from 'typeorm';

export enum OperatorType {
  WHERE = 'where',
  ORWHERE = 'orWhere',
}

export interface FilterQueryInterface {
  getQuery(): SelectQueryBuilder<any>;

  setBaseQuery?: (qb: any) => any;
}
