import { IsEmail, IsNotEmpty } from 'class-validator';

export class MerchantUsersUpdateEmailValidation {
  id: string;
  merchant_id: string;

  @IsNotEmpty({ message: 'Phone tidak boleh kosong' })
  @IsEmail()
  email: string;
}
