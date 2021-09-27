import { IsNotEmpty, IsOptional } from 'class-validator';

export class LoginPhoneValidation {
  @IsNotEmpty()
  phone: string;

  access_type: string;

  @IsOptional()
  password: string;

  @IsOptional()
  lang: string;
}
