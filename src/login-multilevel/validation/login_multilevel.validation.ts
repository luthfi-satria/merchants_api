import { IsOptional } from 'class-validator';

export class ChangeLevelDto {
  @IsOptional()
  merchant_id: string;

  @IsOptional()
  store_id: string;

  level: string;
}
