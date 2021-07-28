import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsUUID,
  Length,
} from 'class-validator';

export class MerchantMerchantValidation {
  id_merchant: string;

  @IsUUID()
  group_id: string;

  name: string;

  @IsUUID()
  lob_id: string;

  status: string;

  address: string;

  owner_name: string;

  @IsNotEmpty()
  @IsEmail()
  owner_email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  owner_phone: string;

  owner_password: string;

  owner_nik: string;

  owner_dob: string;

  owner_dob_city: string;

  owner_address: string;

  owner_ktp: string;

  owner_face_ktp: string;

  bank_id: string;

  bank_acc_name: string;

  bank_acc_number: string;

  tarif_pb1: string;

  created_at: string;

  approved_at: string;
}
