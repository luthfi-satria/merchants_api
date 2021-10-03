import { IsNotEmpty } from 'class-validator';

export class MerchantUsersUpdatePhoneValidation {
  id: string;
  merchant_id: string;

  @IsNotEmpty({ message: 'Phone tidak boleh kosong' })
  phone: string;
}
