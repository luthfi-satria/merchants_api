import { IsNotEmpty } from 'class-validator';

export class LoginPhoneValidation {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  phone: string;

  access_type: string;
}
