import {
  IsBooleanString,
  IsEmail,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import {
  MerchantStatus,
  MerchantType,
} from 'src/database/entities/merchant.entity';

export class UpdateMerchantDTO {
  @IsOptional()
  @IsUUID('all', { message: 'ID bukan format UUID' })
  id: string;

  @IsOptional()
  @IsUUID('all', { message: 'Group ID bukan format UUID' })
  group_id: string;

  @IsOptional()
  @IsIn(Object.values(MerchantType))
  type: MerchantType;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  logo: string;

  profile_store_photo: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsUUID('all', { message: 'Lob ID bukan format UUID' })
  lob_id: string;

  @IsOptional()
  @IsBooleanString({ message: 'Pb1 bukan format Boolean' })
  pb1: string;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsOptional()
  pb1_tariff: number;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsOptional()
  npwp_no: string;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsOptional()
  npwp_name: string;

  npwp_file: string;

  @IsOptional()
  is_pos_checkin_enabled: boolean;

  @IsOptional()
  is_pos_endofday_enabled: boolean;

  @IsOptional()
  is_pos_printer_enabled: boolean;

  @IsOptional()
  is_manual_refund_enabled: boolean;

  @IsOptional()
  @IsString()
  pic_name: string;

  @IsOptional()
  @IsString()
  pic_nip: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  pic_phone: string;

  @IsOptional()
  @ValidateIf((o) => o.pic_email.replace(/\s/g, '') != '')
  @IsString()
  @IsEmail({}, { message: 'Pic Email bukan format email' })
  pic_email: string;

  @IsOptional()
  @IsString()
  pic_password: string;

  @IsOptional()
  @IsIn(Object.values(MerchantStatus))
  status: MerchantStatus;

  @IsOptional()
  rejection_reason: string;
}

export class UpdateStoreSettingsDTO {
  @IsOptional()
  is_pos_checkin_enabled: boolean;

  @IsOptional()
  is_pos_endofday_enabled: boolean;

  @IsOptional()
  is_pos_printer_enabled: boolean;

  @IsOptional()
  is_manual_refund_enabled: boolean;
}
