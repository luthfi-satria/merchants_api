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

export class UpdateMerchantStoreUsersValidation {
  @IsOptional()
  id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  nip: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;

  @IsOptional()
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
