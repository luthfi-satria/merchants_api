import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class MerchantMerchantValidation {
  @IsNotEmpty()
  group_name: string;

  merchant_status: string;

  @IsNotEmpty()
  owner_merchant_name: string;

  @IsNotEmpty()
  @IsEmail()
  merchant_email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  merchant_hp: string;

  @IsNotEmpty()
  merchant_address: string;

  upload_photo_ktp: string;

  @IsNotEmpty()
  nik: string;

  @IsNotEmpty()
  birth_city: string;

  @IsNotEmpty()
  dob: string;

  @IsNotEmpty()
  address_ktp: string;

  upload_photo_yourself_with_ktp: string;

  @IsNotEmpty()
  bank_name: string;

  @IsNotEmpty()
  acc_number: string;

  @IsNotEmpty()
  acc_name: string;

  upload_bankbook: string;

  @IsNotEmpty()
  business_name: string;

  @IsNotEmpty()
  business_fields: string;

  @IsNotEmpty()
  tarif_pb1: string;

  @IsNotEmpty()
  create_date: string;

  approval_date: string;
  id_merchant: string;
}
