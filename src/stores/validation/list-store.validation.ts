import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { CategoryGroup, GroupStatus } from 'src/database/entities/group.entity';

export class ListStoreDTO {
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
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;

  @IsOptional()
  @ValidateIf((o) => o.merchant_id !== '')
  @IsUUID('all', { message: 'Merchant ID yang diisi bukan format UUID' })
  merchant_id: string;
}