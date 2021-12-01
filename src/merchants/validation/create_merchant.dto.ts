import {
  IsBooleanString,
  IsEmail,
  IsIn,
  IsNotEmpty,
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

export class CreateMerchantDTO {
  @IsOptional()
  id: string;

  @IsNotEmpty({ message: 'Group Id harus diisi' })
  @IsUUID('all', { message: 'Group ID bukan format UUID' })
  group_id: string;

  @IsNotEmpty({ message: 'Type harus diisi' })
  @IsIn(Object.values(MerchantType))
  type: MerchantType;

  @IsNotEmpty({ message: 'Name harus diisi' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  logo: string;

  profile_store_photo: string;

  @IsNotEmpty({ message: 'Address harus diisi' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'Lob Id harus diisi' })
  @IsUUID('all', { message: 'Lob ID bukan format UUID' })
  lob_id: string;

  @IsNotEmpty({ message: 'Pb1 harus diisi' })
  @IsBooleanString({ message: 'Pb1 bukan format Boolean' })
  pb1: string;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsNotEmpty()
  pb1_tariff: number;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsNotEmpty()
  npwp_no: string;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsNotEmpty()
  npwp_name: string;

  npwp_file: string;

  @IsOptional()
  is_pos_checkin_enabled: boolean;

  @IsOptional()
  is_pos_endofday_enabled: boolean;

  @IsOptional()
  is_pos_printer_enabled: boolean;

  @IsNotEmpty({ message: 'Pic Name harus diisi' })
  @IsString()
  pic_name: string;

  @IsOptional()
  @IsString()
  pic_nip: string;

  @IsNotEmpty({ message: 'Pic Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  pic_phone: string;

  @IsNotEmpty({ message: 'Pic Email harus diisi' })
  @IsString()
  @IsEmail({}, { message: 'Pic Email bukan format email' })
  pic_email: string;

  @IsNotEmpty({ message: 'Pic Password harus diisi' })
  @IsString()
  pic_password: string;

  @IsNotEmpty()
  @IsIn(Object.values(MerchantStatus))
  status: MerchantStatus;
}
