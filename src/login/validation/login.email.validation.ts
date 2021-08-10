import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginEmailValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
