import { Type } from 'class-transformer';
import { IsBoolean, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class QueryListStoreDto {
  search: string;
  
  @IsLongitude()
  @IsNotEmpty()
  location_longitude:string;

  @IsLatitude()
  @IsNotEmpty()
  location_latitude:string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  distance: number;

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
