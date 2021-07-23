import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class MerchantGroupValidation {
  @IsNotEmpty()
  group_name: string;

  group_status: string;

  @IsNotEmpty()
  owner_group_name: string;

  @IsNotEmpty()
  @IsEmail()
  group_email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  group_hp: string;

  @IsNotEmpty()
  address_group: string;

  @IsNotEmpty()
  create_date: string;

  approval_date: string;
  id_group: string;
  upload_photo_ktp: string;
}
