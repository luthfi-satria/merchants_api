import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class LocationDto {
  @IsLongitude()
  @IsNotEmpty()
  location_longitude: string;

  @IsLatitude()
  @IsNotEmpty()
  location_latitude: string;
}

export class QueryStoreDetailDto extends LocationDto {
  lang: string;
}

export class QueryListStoreDto extends LocationDto {
  search: string;
  lang: string;

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
  @Transform(({ value }) => JSON.parse(value))
  pickup: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  is_24hrs: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  include_closed_stores: boolean;

  price_range_id: string[];

  @IsOptional()
  sort: string;

  @IsOptional()
  order: string;

  @IsBoolean()
  @IsOptional()s
  @Transform(({ value }) => JSON.parse(value))
  new_this_week: boolean;
}
