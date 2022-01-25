import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

export class CreateMerchantUsersValidation {
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail()
  email: string;

  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;

  @IsNotEmpty()
  merchant_id: string;

  @IsOptional()
  nip: string;

  @IsNotEmpty()
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;

  @IsNotEmpty()
  @IsArray()
  store_ids: string[];

  role_id: string;
}

export class UpdateMerchantUsersValidation {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  merchant_id: string;

  @IsOptional()
  nip: string;

  @IsOptional()
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;

  @IsOptional()
  @IsArray()
  store_ids: string[];

  @IsOptional()
  role_id: string;
}

export class MerchantUsersValidation {
  @IsOptional()
  id: string;

  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail()
  email: string;

  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;

  @IsNotEmpty()
  merchant_id: string;

  @IsOptional()
  search: string;

  @IsOptional()
  limit: string;

  @IsOptional()
  page: string;

  @IsOptional()
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;

  @IsNotEmpty()
  @IsArray()
  store_ids: string[];

  role_id: string;
}
