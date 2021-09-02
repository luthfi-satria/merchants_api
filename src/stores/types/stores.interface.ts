export interface IStoreOperationalPayload {
  day_of_week: string;
  operational_hours: IStoreShiftHour[];
}
export interface IStoreShiftHour {
  open_hour?: string;
  close_hour?: string;
}

export interface IsTokenPayload {
  id: string;
  user_type: string;
  roles: string[];
  level: string;
  group_id: string;
  merchant_id: string;
  store_id: string;
  iat: number;
  exp: number;
}
