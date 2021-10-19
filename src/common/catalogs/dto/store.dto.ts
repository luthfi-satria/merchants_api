export class StoreDTO {
  id: string;
  merchant_id: string;
  merchant: any; //MerchantDTO;
  name: string;
  phone: string;
  email: string;
  city_id: string;
  // city: CityDTO;
  address: string;
  location_longitude: number;
  location_latitude: number;
  gmt_offset: number;
  is_store_open: boolean;
  is_open_24h: boolean;
  average_price: number;
  photo: string;
  banner: string;
  // store_categories: StoreCategoriesDTO[];
  delivery_type: string;
  // service_addons: AddonDocument[];

  // bank: ListBankDocument;
  bank_id: string;
  bank_account_no: string;
  bank_account_name: string;
  auto_accept_order: boolean;

  //Metadata
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date;
  approved_at: Date | string;
  rejected_at: Date;
  // operational_hours: StoreOperationalHoursDTO[];
  rejection_reason: string;
}

export class StoreResponseDTO {
  success: string;
  message: string;
  data: StoreDTO[];
  statusCode: number;
  error: string;
}
