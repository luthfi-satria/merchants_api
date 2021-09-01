import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Length,
} from 'class-validator';

export class MerchantMerchantUsersValidation {
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

  @IsOptional()
  merchant_id: string;

  @IsOptional()
  search: string;

  @IsOptional()
  limit: string;

  @IsOptional()
  page: string;
}
