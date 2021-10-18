import { Type } from 'class-transformer';
import {
  IsOptional,
  IsLongitude,
  IsLatitude,
  IsNumberString,
  IsString,
  IsNumber,
} from 'class-validator';

export class QuerySearchValidation {
  @IsOptional()
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
