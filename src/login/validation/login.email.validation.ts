import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginEmailValidation {
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  access_type: string;
}
