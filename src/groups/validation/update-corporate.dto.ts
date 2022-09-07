import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsBooleanString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import {
  CategoryGroup,
  DirectorIdentityType,
  GroupStatus,
} from 'src/database/entities/group.entity';
import { MerchantType } from 'src/database/entities/merchant.entity';
import { enumDeliveryType } from 'src/database/entities/store.entity';

export class UpdateCorporateDto {
  @IsOptional()
  @IsIn(Object.values(CategoryGroup))
  category: CategoryGroup;

  @IsOptional({ message: 'Name harus diisi' })
  @IsString()
  name: string;

  @IsOptional({ message: 'Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsOptional({ message: 'Address harus diisi' })
  @IsString()
  address: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsOptional()
  siup_no: string;

  @IsOptional()
  siup_file: string;

  @IsOptional()
  akta_pendirian_file: string;

  @IsOptional()
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
  director_nip: string;

  @IsOptional()
  @IsString()
  director_phone: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  director_email: string;

  @IsOptional()
  @IsIn(Object.values(DirectorIdentityType))
  director_identity_type: DirectorIdentityType;

  @IsOptional()
  @IsString()
  director_id_no: string;

  @IsOptional()
  director_id_file: string;

  // @ValidateIf((o) => o.category === CategoryGroup.PERSONAL)
  // @IsNotEmpty()
  director_id_face_file: string;

  @IsOptional()
  @Transform(({ value }) => String(value) === 'true')
  @IsBoolean()
  director_is_multilevel_login: boolean;

  //Penanggung Jawab Operasional
  @IsOptional()
  @IsString()
  pic_operational_name: string;

  @IsOptional()
  pic_operational_nip: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  pic_operational_email: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  pic_operational_phone: string;

  @IsOptional()
  @Transform(({ value }) => String(value) === 'true')
  @IsBoolean()
  pic_operational_is_multilevel_login: boolean;

  //Penanggung Jawab Keuangan
  @IsOptional()
  @IsString()
  pic_finance_name: string;

  @IsOptional()
  pic_finance_nip: string;

  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail()
  pic_finance_email: string;

  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  pic_finance_phone: string;

  @IsOptional()
  @IsBooleanString()
  pic_finance_is_multilevel_login: boolean;

  @IsOptional()
  @IsIn(Object.values(GroupStatus))
  status: GroupStatus;

  @IsOptional()
  director_password: string;

  @IsOptional()
  pic_operational_password: string;

  @IsOptional()
  pic_finance_password: string;

  @IsOptional()
  id: string;

  @IsOptional()
  @IsIn(Object.values(MerchantType))
  type: MerchantType;

  logo: string;

  profile_store_photo: string;

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
  npwp_name: string;

  @IsOptional()
  is_pos_checkin_enabled: boolean;

  @IsOptional()
  is_pos_endofday_enabled: boolean;

  @IsOptional()
  is_pos_printer_enabled: boolean;

  @IsOptional()
  is_manual_refund_enabled: boolean;

  @IsOptional()
  is_pos_rounded_payment: boolean;

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
  @IsString()
  @IsEmail({}, { message: 'Pic Email bukan format email' })
  pic_email: string;

  @IsOptional()
  @IsString()
  pic_password: string;

  @IsOptional()
  @IsString()
  pic_is_multilevel_login: string;

  @IsOptional()
  @IsString()
  pic_is_director: string;

  @IsOptional()
  @IsUUID()
  city_id: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  gmt_offset: number;

  @IsOptional()
  @ArrayMaxSize(4)
  category_ids: string[];

  @IsOptional()
  @IsIn(Object.values(enumDeliveryType))
  delivery_type: enumDeliveryType;

  @IsOptional()
  service_addons: string[] = [];

  @IsOptional()
  @IsUUID()
  bank_id: string;

  @IsOptional()
  @IsString()
  bank_account_no: string;

  @IsOptional()
  @IsString()
  bank_account_name: string;

  @IsOptional()
  @IsBooleanString({ message: 'auto_accept_order bukan format Boolean' })
  auto_accept_order: string;

  @IsOptional()
  location_latitude: number;

  @IsOptional()
  location_longitude: number;

  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp_code: string;
}
