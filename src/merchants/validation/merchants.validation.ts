import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsUUID,
  Length,
} from 'class-validator';

export class MerchantMerchantValidation {
  id: string;

  @IsUUID()
  group_id: string;

  @IsNotEmpty()
  name: string;

  @IsUUID()
  lob_id: string;

  status: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  owner_name: string;

  @IsNotEmpty()
  @IsEmail()
  owner_email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  owner_phone: string;

  @IsNotEmpty()
  owner_password: string;

  @IsNotEmpty()
  owner_nik: string;

  owner_dob: string;

  @IsNotEmpty()
  owner_dob_city: string;

  @IsNotEmpty()
  owner_address: string;

  owner_ktp: string;

  owner_face_ktp: string;

  @IsUUID()
  bank_id: string;

  @IsNotEmpty()
  bank_acc_name: string;

  @IsNotEmpty()
  bank_acc_number: string;

  @IsNotEmpty()
  tarif_pb1: string;

  created_at: string;

  approved_at: string;
  token: string;
}
