import { IsArray, IsIn, IsOptional } from 'class-validator';
import { GroupStatus } from 'src/database/entities/group.entity';

export class CountGroupDto {
  @IsOptional()
  @IsArray()
  @IsIn(Object.values(GroupStatus), { each: true })
  status: GroupStatus[];
}
