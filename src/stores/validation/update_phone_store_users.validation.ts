import { IsNumberString, Length } from 'class-validator';

export class UpdatePhoneStoreUsersValidation {
  @IsNumberString({}, { message: 'Nomer telpon bukan angka' })
  @Length(10, 15)
  phone: string;
}
