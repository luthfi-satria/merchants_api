import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

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
  stores: string[];
}
