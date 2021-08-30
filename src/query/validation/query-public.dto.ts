import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class QueryListStoreDto {
  search: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number;

  @IsUUID()
  @IsOptional()
  store_category_id: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pickup: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_24hrs: boolean;
}
