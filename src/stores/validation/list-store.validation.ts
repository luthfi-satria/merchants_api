import { IsIn, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { CategoryGroup, GroupStatus } from 'src/database/entities/group.entity';

export class ListStoreDTO {
  @IsOptional()
  search: string;

  @IsOptional()
  @IsNumber({}, { message: 'Limit yang diisi bukan format number' })
  limit: number;

  @IsOptional()
  @IsNumber({}, { message: 'Page yang diisi bukan format number' })
  page: string;

  @IsOptional()
  @ValidateIf((o) => o.group_category !== '')
  @IsIn(Object.values(CategoryGroup))
  group_category: CategoryGroup;

  @IsOptional()
  @ValidateIf((o) => o.status !== '')
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;
}
