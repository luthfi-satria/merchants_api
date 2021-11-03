import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsLongitude,
  IsLatitude,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class QuerySearchValidation {
  @IsString()
  @IsNotEmpty()
  search: string;

  @IsString()
  @IsOptional()
  lang: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number;

  @IsLongitude()
  location_longitude: string;

  @IsLatitude()
  location_latitude: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  distance: number;

  @IsUUID()
  @IsOptional()
  store_category_id: string;

  @IsUUID()
  @IsOptional()
  merchant_id: string;

  @IsString()
  @IsOptional()
  order: string;

  @IsString()
  @IsOptional()
  sort: string;

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
  new_this_week: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  budget_meal: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  include_inactive_stores: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  include_closed_stores: boolean;
}

export class QuerySearchHistoryValidation {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number;
}

export class QuerySearchHistoryStoresValidation extends QuerySearchHistoryValidation {
  @IsLongitude()
  location_longitude: string;

  @IsLatitude()
  location_latitude: string;
}
