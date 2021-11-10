import {
  IsEmail,
  IsIn,
  IsOptional,
  IsNumberString,
  IsString,
  Length,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import {
  CategoryGroup,
  DirectorIdentityType,
  GroupStatus,
} from 'src/database/entities/group.entity';

export class UpdateGroupDTO {
  @IsOptional()
  @IsNotEmpty()
  @IsIn(Object.values(CategoryGroup))
  category: CategoryGroup;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsOptional()
  @IsNotEmpty()
  siup_no: string;

  siup_file: string;

  akta_pendirian_file: string;

  akta_perubahan_file: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsOptional()
  @IsNotEmpty()
  npwp_no: string;

  npwp_file: string;

  // Direktur
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  director_name: string;

  @IsOptional()
  @IsString()
  director_nip: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  director_phone: string;

  @IsOptional()
  @IsEmail()
  director_email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsIn(Object.values(DirectorIdentityType))
  director_identity_type: DirectorIdentityType;

  @IsOptional()
  @IsString()
  director_id_no: string;

  director_id_file: string;

  director_id_face_file: string;

  //Penanggung Jawab Operasional
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  pic_operational_name: string;

  @IsOptional()
  @IsString()
  pic_operational_nip: string;

  @IsOptional()
  @IsEmail()
  pic_operational_email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  pic_operational_phone: string;

  //Penanggung Jawab Keuangan
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  pic_finance_name: string;

  @IsOptional()
  @IsString()
  pic_finance_nip: string;

  @IsOptional()
  @IsEmail()
  pic_finance_email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  pic_finance_phone: string;

  @IsOptional()
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;

  @IsOptional()
  director_password: string;

  @IsOptional()
  pic_operational_password: string;

  @IsOptional()
  pic_finance_password: string;
}
