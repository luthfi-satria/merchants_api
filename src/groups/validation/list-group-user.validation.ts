import {
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { GroupStatus } from 'src/database/entities/group.entity';

export class ListGroupUserDTO {
  @IsOptional()
  search: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit yang diisi bukan format number' })
  limit: number;

  @IsOptional()
  @IsNumberString({}, { message: 'Page yang diisi bukan format number' })
  page: string;

  @IsOptional()
  @IsUUID('all', { message: 'Role ID yang diisi bukan format UUID' })
  role_id: string;

  @IsOptional()
  @IsUUID('all', { message: 'Group ID yang diisi bukan format UUID' })
  group_id: string;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(GroupStatus), { each: true })
  statuses: GroupStatus[];
}
