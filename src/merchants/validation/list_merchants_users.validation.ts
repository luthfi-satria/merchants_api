import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class ListMerchantUserStatuses {
  ACTIVE = 'ACTIVE';
  INACTIVE = 'INACTIVE';
}

export class ListMerchantUsersValidation {
  @IsOptional()
  search: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit yang diisi bukan format number' })
  limit: number;

  @IsOptional()
  @IsNumberString({}, { message: 'Page yang diisi bukan format number' })
  page: string;

  @IsOptional()
  @IsUUID('all', { message: 'Role ID yang diisi bukan format UUID' })
  role_id: string;

  @IsOptional()
  @IsUUID('all', { message: 'Group ID yang diisi bukan format UUID' })
  group_id: string;

  @IsNotEmpty()
  @IsUUID('all', { message: 'Merchant ID yang diisi bukan format UUID' })
  merchant_id: string;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(ListMerchantUserStatuses), { each: true })
  statuses: ListMerchantUserStatuses[];
}
