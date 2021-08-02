import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class MerchantStoreValidation {
  @IsUUID()
  @IsNotEmpty()
  merchant_id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  owner_phone: string;

  @IsNotEmpty()
  @IsEmail()
  owner_email: string;

  @IsNotEmpty()
  owner_password: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  post_code: string;

  @IsNotEmpty()
  guidance: string;

  @IsNotEmpty()
  location_longitude: string;

  @IsNotEmpty()
  location_latitude: string;

  upload_photo: string;

  @IsNotEmpty()
  service_addon: string[];

  id: string;
}
