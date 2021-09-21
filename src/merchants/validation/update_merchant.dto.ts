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
  pb1_tarif: number;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsOptional()
  npwp_no: string;

  @ValidateIf((o) => o.pb1 === 'true')
  @IsOptional()
  npwp_name: string;

  npwp_file: string;

  @IsOptional()
  @IsString()
  pic_name: string;

  @IsOptional()
  @IsString()
  pic_nip: string;

  @IsOptional()
  @IsString()
  pic_phone: string;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Pic Email bukan format email' })
  pic_email: string;

  @IsOptional()
  @IsString()
  pic_password: string;

  @IsOptional()
  @IsIn(Object.values(MerchantStatus))
  status: MerchantStatus;
}