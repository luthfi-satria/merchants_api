import { IsArray, IsOptional } from 'class-validator';

export class BannersDto {
  store_ids: string[];
  merchant_id: string;
  all: boolean;
  banner: string;

  @IsOptional()
  @IsArray()
  delete_files?: string[];
}
