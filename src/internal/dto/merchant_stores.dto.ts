import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class MerchantStoresDto {
  @IsNotEmpty()
  merchant_id: string;

  @IsOptional()
  statuses: string[];

  @IsOptional()
  search: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;
}
