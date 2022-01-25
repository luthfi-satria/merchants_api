import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

export class MerchantStoreUsersValidation {
  @IsOptional()
  id: string;

  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsOptional()
  nip: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;

  @IsNotEmpty({ message: 'Store ID tidak boleh kosong' })
  @IsUUID('all', { message: 'Store ID bukan format UUID' })
  store_id: string;

  @IsNotEmpty({ message: 'Role ID tidak boleh kosong' })
  @IsUUID('all', { message: 'Role ID bukan format UUID' })
  role_id: string;

  @IsOptional()
  @IsIn(Object.values(MerchantUsersStatus))
  status: MerchantUsersStatus;
}
