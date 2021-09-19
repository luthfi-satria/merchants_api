import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CityDTO } from 'src/common/services/admins/dto/city.dto';
import {
  enumDeliveryType,
  enumStoreStatus,
} from 'src/database/entities/store.entity';

export class CreateMerchantStoreValidation {
  id: string;

  @IsUUID()
  @IsNotEmpty()
  merchant_id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUUID()
  city_id: string;

  city: CityDTO;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  gmt_offset: number;

  photo: string;

  @IsNotEmpty()
  @ArrayMaxSize(3)
  category_ids: string[];

  @IsNotEmpty()
  @IsIn(Object.values(enumDeliveryType))
  delivery_type: enumDeliveryType;

  @IsOptional()
  service_addons: string[] = [];

  // Data Bank
  @IsNotEmpty()
  @IsUUID()
  bank_id: string;

  @IsNotEmpty()
  @IsString()
  bank_account_no: string;

  @IsNotEmpty()
  @IsString()
  bank_account_name: string;

  // Metadata
  @IsNotEmpty()
  @IsIn(Object.values(enumStoreStatus))
  status: enumStoreStatus;
}
