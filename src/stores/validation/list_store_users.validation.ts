import {
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';
import { Type } from 'class-transformer';

export class ListMerchantStoreUsersValidation {
  @IsOptional()
  id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  nip: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;

  @IsOptional()
  password: string;

  @IsOptional()
  @ValidateIf((o) => o.store_id !== '')
  @IsUUID('all', { message: 'Store ID bukan format UUID' })
  store_id: string;

  @IsOptional()
  @ValidateIf((o) => o.merchant_id !== '')
  @IsUUID('all', { message: 'Merchant ID bukan format UUID' })
  merchant_id: string;

  @IsOptional()
  @ValidateIf((o) => o.group_id !== '')
  @IsUUID('all', { message: 'Group ID bukan format UUID' })
  group_id: string;

  @IsOptional()
  @ValidateIf((o) => o.role_id !== '')
  @IsUUID('all', { message: 'Role ID bukan format UUID' })
  role_id: string;

  @IsOptional()
  search: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit bukan format number' })
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit bukan format number' })
  page: number;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(MerchantUsersStatus), { each: true })
  statuses: MerchantUsersStatus[];
}
