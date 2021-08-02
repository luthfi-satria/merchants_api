import { IsEmail, IsNotEmpty } from 'class-validator';

export class StoreLoginEmailValidation {
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  access_type: string;
}
