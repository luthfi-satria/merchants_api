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

  @IsOptional()
  platform: string;

  @IsUUID()
  @IsOptional()
  store_category_id: string;

  @IsUUID()
  @IsOptional()
  merchant_id: string;

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

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  include_inactive_stores: boolean;

  price_range_id: string[];

  @IsOptional()
  sort: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minimum_rating: number;

  @IsOptional()
  order: string;

  @IsOptional()
  promo: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  new_this_week: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  budget_meal: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  favorite_this_week: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  load_menu?: boolean;
}
