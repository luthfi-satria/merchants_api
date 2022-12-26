import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { CategoryGroup, GroupStatus } from 'src/database/entities/group.entity';

export class ListReprotNewMerchantDTO {
  @IsOptional()
  search: string;

  @IsOptional()
  platform: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit yang diisi bukan format number' })
  limit: number;

  @IsOptional()
  @IsNumberString({}, { message: 'Page yang diisi bukan format number' })
  page: string;

  @IsDateString()
  @IsOptional()
  date_start?: string;

  @IsDateString()
  @IsOptional()
  date_end?: string;

  @IsOptional()
  @ValidateIf((o) => o.group_category !== '')
  @IsIn(Object.values(CategoryGroup))
  group_category: CategoryGroup;

  @IsOptional()
  @ValidateIf((o) => o.status !== '')
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;

  @IsOptional()
  @ValidateIf((o) => o.merchant_id !== '')
  @IsUUID('all', { message: 'Merchant ID yang diisi bukan format UUID' })
  merchant_id: string;

  @IsOptional()
  @IsArray()
  merchant_ids: string[];

  @IsOptional()
  @ValidateIf((o) => o.group_id !== '')
  @IsUUID('all', { message: 'Group ID yang diisi bukan format UUID' })
  group_id: string;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(GroupStatus), { each: true })
  statuses: GroupStatus[];

  store_id: string;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsString()
  sheet_name?: string;
}
