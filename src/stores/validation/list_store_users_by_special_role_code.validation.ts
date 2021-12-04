import { IsArray, IsIn, IsNumber, IsOptional } from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';
import { Type } from 'class-transformer';

export class ListMerchantStoreUsersBySpecialRoleCodeValidation {
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
