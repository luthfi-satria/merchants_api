export interface IStoreOperationalPayload {
  open_hour: string;
  close_hour: string;
  day_of_week: number;
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
