import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import {
  CategoryGroup,
  DirectorIdentityType,
  GroupStatus,
} from 'src/database/entities/group.entity';

export class CreateGroupDTO {
  @IsNotEmpty()
  @IsIn(Object.values(CategoryGroup))
  category: CategoryGroup;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsNotEmpty()
  siup_no: string;

  // @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  // @IsNotEmpty()
  siup_file: string;

  // @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  // @IsNotEmpty()
  akta_pendirian_file: string;

  // @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  // @IsNotEmpty()
  akta_perubahan_file: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsNotEmpty()
  npwp_no: string;

  // @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  // @IsNotEmpty()
  npwp_file: string;

  // Direktur
  @IsNotEmpty()
  @IsString()
  director_name: string;

  @IsOptional()
  director_nip: string;

  @IsNotEmpty()
  @IsString()
  director_phone: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  director_email: string;

  @IsNotEmpty()
  @IsIn(Object.values(DirectorIdentityType))
  director_identity_type: DirectorIdentityType;

  @IsNotEmpty()
  @IsString()
  director_id_no: string;

  director_id_file: string;

  // @ValidateIf((o) => o.category === CategoryGroup.PERSONAL)
  // @IsNotEmpty()
  director_id_face_file: string;

  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  director_is_multilevel_login: boolean;

  //Penanggung Jawab Operasional
  @IsNotEmpty()
  @IsString()
  pic_operational_name: string;

  @IsOptional()
  pic_operational_nip: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  pic_operational_email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  pic_operational_phone: string;

  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  pic_operational_is_multilevel_login: boolean;

  //Penanggung Jawab Keuangan
  @IsNotEmpty()
  @IsString()
  pic_finance_name: string;

  @IsOptional()
  pic_finance_nip: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  pic_finance_email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  pic_finance_phone: string;

  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  pic_finance_is_multilevel_login: boolean;

  @IsNotEmpty()
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;

  @IsNotEmpty({ message: 'Director Password harus diisi' })
  director_password: string;

  @IsNotEmpty({ message: 'Pic Operational Password harus diisi' })
  pic_operational_password: string;

  @IsNotEmpty({ message: 'Pic Finance Password harus diisi' })
  pic_finance_password: string;
}
