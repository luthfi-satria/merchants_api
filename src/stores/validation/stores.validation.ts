import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { enumDeliveryType } from 'src/database/entities/store.entity';

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

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  gmt_offset: number;

  upload_photo: string;

  service_addon: string[];

  id: string;
}

export class DeliveryTypeValidation {
  @IsNotEmpty()
  @IsEnum(enumDeliveryType, {
    message: `Value yang diterima hanya enum ${enumDeliveryType.delivery_only} atau ${enumDeliveryType.delivery_and_pickup}`,
  })
  delivery_type: enumDeliveryType;
}
