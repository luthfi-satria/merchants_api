import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  otp_code: string;
}

export class OtpDto {
  @IsString()
  @IsOptional()
  id: string;
  @IsString()
  @IsOptional()
  id_otp: string;
  @IsString()
  @IsEmail()
  @IsOptional()
  email: string;
  @IsString()
  @IsOptional()
  phone: string;
  @IsString()
  @IsOptional()
  referral_code: string;
  @IsString()
  @IsOptional()
  otp_code: string;
  @IsString()
  @IsOptional()
  user_type: string;
  @IsString()
  @IsOptional()
  validated: string;
}

export class UpdatePhoneDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  otp_code: string;
}
