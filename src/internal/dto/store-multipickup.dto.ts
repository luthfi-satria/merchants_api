import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { enumStoreStatus } from 'src/database/entities/store.entity';
export class StoresMultipickupDto {
  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;

  @IsNotEmpty()
  @IsEnum(enumStoreStatus)
  status: enumStoreStatus;

  @IsOptional()
  limit: number;

  @IsOptional()
  is_24hrs: boolean;

  @IsOptional()
  store_category_id: string;

  @IsOptional()
  lang: string;

  @IsOptional()
  price_low: number;

  @IsOptional()
  price_high: number;

  @IsOptional()
  rating: number;

  @IsOptional()
  numdiscounts: boolean;
  /**
   * SORTING
   */
  @IsOptional()
  sort_by: string;
}
