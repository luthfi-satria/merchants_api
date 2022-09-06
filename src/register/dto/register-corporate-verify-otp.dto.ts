
import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class RegisterCorporateVerifyOtpDto {
  @IsNotEmpty({ message: 'Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp_code: string;
}
