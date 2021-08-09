import { IsNotEmpty } from 'class-validator';

export class LoginPhoneValidation {
  @IsNotEmpty()
  phone: string;

  access_type: string;
}
