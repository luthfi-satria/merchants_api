import {
  IsEmail,
  IsIn,
  IsOptional,
  IsNumberString,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import {
  CategoryGroup,
  DirectorIdentityType,
  GroupStatus,
} from 'src/database/entities/group.entity';

export class UpdateGroupDTO {
  @IsOptional()
  @IsIn(Object.values(CategoryGroup))
  category: CategoryGroup;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsOptional()
  @IsString()
  address: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsOptional()
  siup_no: string;

  siup_file: string;

  akta_pendirian_file: string;

  akta_perubahan_file: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsOptional()
  npwp_no: string;

  npwp_file: string;

  // Direktur
  @IsOptional()
  @IsString()
  director_name: string;

  @IsOptional()
  @IsString()
  director_phone: string;

  @IsOptional()
  @IsString()
  director_email: string;

  @IsOptional()
  @IsIn(Object.values(DirectorIdentityType))
  director_identity_type: DirectorIdentityType;

  @IsOptional()
  @IsString()
  director_id_no: string;

  director_id_file: string;

  director_id_face_file: string;

  //Penanggung Jawab Operasional
  @IsOptional()
  @IsString()
  pic_operational_name: string;

  @IsOptional()
  @IsEmail()
  pic_operational_email: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  pic_operational_phone: string;

  //Penanggung Jawab Keuangan
  @IsOptional()
  @IsString()
  pic_finance_name: string;

  @IsOptional()
  @IsEmail()
  pic_finance_email: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  pic_finance_phone: string;

  @IsOptional()
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;
}
