import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

export class MerchantGroupUsersValidation {
  @IsOptional()
  id: string;

  @IsNotEmpty()
  @IsUUID()
  group_id: string;

  @IsNotEmpty()
  @IsBoolean()
  is_multilevel_login: boolean;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  nip: string;

  // @IsNotEmpty()
  @IsOptional()
  @ValidateIf((o) => o.email.replace(/\s/g, '') != '')
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;

  @IsOptional()
  rejection_reason: string;

  @IsNotEmpty()
  @IsUUID()
  role_id: string;
}

export class UpdateMerchantGroupUsersValidation {
  @IsOptional()
  @ValidateIf((o) => o.group_id != '')
  @IsUUID()
  group_id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.nip != '')
  @MaxLength(16, { message: 'NIK maksimum 16 karakter' })
  nip: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  email: string;

  @IsOptional()
  @ValidateIf((o) => o.phone != '')
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsOptional()
  password: string;

  @IsOptional()
  @ValidateIf((o) => o.status != '')
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;

  @IsOptional()
  rejection_reason: string;

  @IsOptional()
  @ValidateIf((o) => o.role_id != '')
  @IsUUID()
  role_id: string;

  id: string;
}
