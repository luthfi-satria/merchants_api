import {
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { CategoryGroup } from 'src/database/entities/group.entity';
import { MerchantStatus } from 'src/database/entities/merchant.entity';

export class ListMerchantDTO {
  @IsOptional()
  search: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit yang diisi bukan format number' })
  limit: number;

  @IsOptional()
  @IsNumberString({}, { message: 'Page yang diisi bukan format number' })
  page: string;

  @IsOptional()
  @ValidateIf((o) => o.group_category !== '')
  @IsIn(Object.values(CategoryGroup))
  group_category: CategoryGroup;

  @IsOptional()
  @ValidateIf((o) => o.status !== '')
  @IsIn(Object.values(MerchantStatus))
  status: MerchantStatus;

  @IsOptional()
  @ValidateIf((o) => o.group_id !== '')
  @IsUUID('all', { message: 'Group ID yang diisi bukan format UUID' })
  group_id: string;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(MerchantStatus), { each: true })
  statuses: MerchantStatus[];
}
