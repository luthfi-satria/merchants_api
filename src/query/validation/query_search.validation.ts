import { Type } from 'class-transformer';
import {
  IsOptional,
  IsLongitude,
  IsLatitude,
  IsString,
  IsNumber,
  IsNotEmpty,
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
