import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class RegisterCorporateOTPDto {
  @IsNotEmpty({ message: 'Phone harus diisi' })
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  group_id: string;
}
