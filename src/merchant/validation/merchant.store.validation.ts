import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class MerchantStoreValidation {
  @IsNotEmpty()
  group_name: string;

  @IsNotEmpty()
  merchant_name: string;

  @IsNotEmpty()
  store_name: string;

  @IsNotEmpty()
  store_phone: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  store_hp: string;

  @IsNotEmpty()
  @IsEmail()
  store_email: string;

  @IsNotEmpty()
  @IsEmail()
  email_settlement: string;

  @IsNotEmpty()
  address_store: string;

  @IsNotEmpty()
  post_code: string;

  @IsNotEmpty()
  guidance: string;

  @IsNotEmpty()
  longitude_latitude: string;

  upload_photo_store: string;

  @IsNotEmpty()
  services_addon: string;

  @IsNotEmpty()
  toc: string;

  @IsNotEmpty()
  create_date: string;

  approval_date: string;
  id_store: string;
}
