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

export class VerifyLoginDto {
  @IsNotEmpty()
  user_id: string;

  @IsNotEmpty()
  password: string;
}
