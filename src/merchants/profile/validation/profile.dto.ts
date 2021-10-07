import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GroupDocument } from 'src/database/entities/group.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreDocument } from 'src/database/entities/store.entity';

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

export class UbahEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifikasiUbahEmailDto {
  @IsNotEmpty()
  token: string;
}

export class ResponseMerchantDto {
  id: string;

  name: string;

  email: string;

  phone: string;

  group_id: string;

  merchant_id: string;

  store_id: string;

  created_at: Date | string;

  updated_at: Date | string;

  deleted_at: Date;

  group: GroupDocument;

  merchant: MerchantDocument;

  store: StoreDocument;

  nip: string;
}
