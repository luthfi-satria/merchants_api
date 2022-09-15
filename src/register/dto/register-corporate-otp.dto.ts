import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';

export class RegisterCorporateOTPDto {
  @IsNotEmpty({ message: 'Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  group_id: string;

  @IsNotEmpty({ message: 'Name harus diisi' })
  @IsString()
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  director_email: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  pic_finance_email: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  pic_operational_email: string;

  @IsNotEmpty()
  @IsString()
  director_phone: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  pic_finance_phone: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  pic_operational_phone: string;
}
