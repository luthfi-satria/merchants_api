import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class OtpValidateValidation {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp_code: string;
  user_type: string;
  id_profile: number;
  id: number;
  roles: string[];
}
