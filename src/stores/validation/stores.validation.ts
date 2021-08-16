import {
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';

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
  @IsLongitude({ message: 'Longitude yang anda masukan salah.' })
  location_longitude: string;

  @IsNotEmpty()
  @IsLatitude({ message: 'Latitude yang anda masukan salah.' })
  location_latitude: string;

  upload_photo: string;

  @IsNotEmpty()
  service_addon: string[];

  id: string;
}
