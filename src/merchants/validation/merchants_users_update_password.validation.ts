import { IsNotEmpty } from 'class-validator';

export class MerchantUsersUpdatePasswordValidation {
  id: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}
