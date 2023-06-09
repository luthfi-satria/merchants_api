export class PriceCategoryDTO {
  id: string;
  name: string;
  merchant_id: string;
  status: string;
  default_price_category_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
}

export class PriceCategoryStoreDTO {
  id: string;
  name: string;
  store_id: string;
  merchant_id: string;
  status: string;
  default_price_category_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  sales_channel_id: string;
}
