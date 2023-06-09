import {
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { CategoryGroup, GroupStatus } from 'src/database/entities/group.entity';

export enum SearchFields {
  Name = 'name',
  Phone = 'phone',
  Category = 'category',
}

export class ListGroupDTO {
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
  @IsArray()
  @IsIn(Object.values(GroupStatus), { each: true })
  statuses: GroupStatus[];

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(SearchFields), { each: true })
  search_fields: SearchFields[];
}
