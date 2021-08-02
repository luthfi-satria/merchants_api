import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class MerchantGroupValidation {
  @IsNotEmpty()
  name: string;

  status: string;

  @IsNotEmpty()
  owner_name: string;

  owner_password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  address: string;

  created_at: string;
  approved_at: string;
  id: string;
  owner_ktp: string;
}
