import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  ArrayMaxSize,
  IsBooleanString,
} from 'class-validator';
import { CityDTO } from 'src/common/services/admins/dto/city.dto';
import {
  enumDeliveryType,
  enumStoreStatus,
} from 'src/database/entities/store.entity';

export class UpdateMerchantStoreValidation {
  id: string;

  @IsUUID()
  @IsOptional()
  merchant_id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  city_id: string;

  city: CityDTO;

  @IsOptional()
  address: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  gmt_offset: number;

  photo: string;

  banner: string;

  @IsOptional()
  @ArrayMaxSize(3)
  category_ids: string[];

  @IsOptional()
  @IsIn(Object.values(enumDeliveryType))
  delivery_type: enumDeliveryType;

  @IsOptional()
  service_addons: string[];

  // Data Bank
  @IsOptional()
  @IsUUID()
  bank_id: string;

  @IsOptional()
  @IsString()
  bank_account_no: string;

  @IsOptional()
  @IsString()
  bank_account_name: string;

  // Metadata
  @IsOptional()
  @IsIn(Object.values(enumStoreStatus))
  status: enumStoreStatus;

  @IsOptional()
  @IsBooleanString({ message: 'auto_accept_order bukan format Boolean' })
  auto_accept_order: string;
}
