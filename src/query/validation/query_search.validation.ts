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
  @IsOptional()
  location_longitude: string;

  @IsLatitude()
  @IsOptional()
  location_latitude: string;
}
