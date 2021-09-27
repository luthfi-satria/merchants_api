import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginEmailValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  password: string;

  @IsOptional()
  lang: string;
}
