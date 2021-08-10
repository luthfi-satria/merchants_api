import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class OtpEmailValidateValidation {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp_code: string;
  user_type: string;
  id_profile: number;
  id: number;
  roles: string[];
}
