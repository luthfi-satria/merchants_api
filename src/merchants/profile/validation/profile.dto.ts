import { IsEmail, IsOptional, IsString } from 'class-validator';
import { CityDTO } from 'src/common/services/admins/dto/city.dto';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { CategoryGroup, DirectorIdentityType, GroupDocument, GroupStatus } from 'src/database/entities/group.entity';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { MerchantDocument, MerchantStatus } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { enumDeliveryType, enumStoreStatus, StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';

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

export class MerchantDto {
  id: string;

  group_id: string;

  type: string;

  name: string;

  phone: string;

  logo: string;

  profile_store_photo: string;

  address: string;

  lob_id: string;

  pb1: boolean;

  pb1_tariff: number;

  npwp_no: string;

  npwp_name: string;

  npwp_file: string;

  pic_name: string;

  pic_nip: string;

  pic_phone: string;

  pic_email: string;

  pic_password: string;

  status: MerchantStatus;

  approved_at: Date | string;

  created_at: Date | string;

  updated_at: Date | string;

  deleted_at: Date;

  group: GroupDto;
}

export class GroupDto {
  id: string;

  category: CategoryGroup;

  name: string;

  phone: string;

  address: string;

  siup_no: string;

  siup_file: string;

  akta_pendirian_file: string;

  akta_perubahan_file: string;

  npwp_no: string;

  npwp_file: string;

  director_name: string;

  director_nip: string;

  director_phone: string;

  director_email: string;

  director_password: string;

  director_identity_type: DirectorIdentityType;

  director_id_no: string;

  director_id_file: string;

  director_id_face_file: string;

  pic_operational_name: string;

  pic_operational_nip: string;

  pic_operational_email: string;

  pic_operational_phone: string;

  pic_operational_password: string;

  pic_finance_name: string;

  pic_finance_nip: string;

  pic_finance_email: string;

  pic_finance_phone: string;

  pic_finance_password: string;

  status: GroupStatus;

  approved_at: Date | string;

  created_at: Date | string;

  updated_at: Date | string;

  deleted_at: Date;

  merchants: MerchantDocument[];

  users: MerchantUsersDocument[];
}

export class StoreDto {
  id: string;

  merchant: MerchantDocument;

  merchant_id: string;

  name: string;

  phone: string;

  email: string;

  city_id: string;
  
  city: CityDTO;

  address: string;

  location_longitude: number;

  location_latitude: number;

  gmt_offset: number;

  is_store_open: boolean;

  is_open_24h: boolean;

  average_price: number;

  photo: string;

  store_categories: StoreCategoriesDocument[];

  delivery_type: enumDeliveryType;

  addons: AddonDocument[];

  bank: ListBankDocument;

  bank_id: string;

  bank_account_no: string;

  bank_account_name: string;

  status: enumStoreStatus;

  created_at: Date | string;

  updated_at: Date | string;

  deleted_at: Date;

  operational_hours: StoreOperationalHoursDocument[];
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

  group: GroupDto;

  merchant: MerchantDto;

  store: StoreDto;

  nip: string;
}
