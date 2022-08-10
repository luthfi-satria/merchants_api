import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsBooleanString,
  IsEmail,
  IsIn,
  IsLatitude,
  IsLongitude,
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

export class RegisterCorporateDto {
  @IsNotEmpty()
  @IsIn(Object.values(CategoryGroup))
  category: CategoryGroup;

  @IsNotEmpty({ message: 'Name harus diisi' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty({ message: 'Address harus diisi' })
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
  @IsOptional()
  akta_perubahan_file: string;

  @ValidateIf((o) => o.category === CategoryGroup.COMPANY)
  @IsNotEmpty()
  npwp_no: string;

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
  @Transform(({ value }) => String(value) === 'true')
  @IsBoolean()
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
  @Transform(({ value }) => String(value) === 'true')
  @IsBoolean()
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
  @IsBooleanString()
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

  @IsOptional()
  id: string;

  @IsNotEmpty({ message: 'Type harus diisi' })
  @IsIn(Object.values(MerchantType))
  type: MerchantType;

  logo: string;

  profile_store_photo: string;

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

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Pic Email bukan format email' })
  pic_email: string;

  @IsNotEmpty({ message: 'Pic Password harus diisi' })
  @IsString()
  pic_password: string;

  @IsNotEmpty()
  @IsString()
  pic_is_multilevel_login: string;

  @IsOptional()
  @IsString()
  pic_is_director: string;

  @IsNotEmpty()
  @IsUUID()
  city_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  gmt_offset: number;

  @IsNotEmpty()
  @ArrayMaxSize(4)
  category_ids: string[];

  @IsNotEmpty()
  @IsIn(Object.values(enumDeliveryType))
  delivery_type: enumDeliveryType;

  @IsOptional()
  service_addons: string[] = [];

  @IsNotEmpty()
  @IsUUID()
  bank_id: string;

  @IsNotEmpty()
  @IsString()
  bank_account_no: string;

  @IsNotEmpty()
  @IsString()
  bank_account_name: string;

  @IsOptional()
  @IsBooleanString({ message: 'auto_accept_order bukan format Boolean' })
  auto_accept_order: string;

  @IsOptional()
  location_latitude: number;

  @IsOptional()
  location_longitude: number;
}
