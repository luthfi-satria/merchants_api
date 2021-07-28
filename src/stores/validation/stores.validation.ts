import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class MerchantStoreValidation {
  @IsUUID()
  @IsNotEmpty()
  merchant_id: string;

  @IsNotEmpty()
  name: string;

  phone: string;

  @IsNotEmpty()
  owner_phone: string;

  @IsNotEmpty()
  @IsEmail()
  owner_email: string;

  @IsNotEmpty()
  owner_password: string;

  address: string;

  post_code: string;

  guidance: string;

  location_longitude: string;

  location_latitude: string;

  upload_photo: string;

  service_addon: string;

  store_id: string;
}
