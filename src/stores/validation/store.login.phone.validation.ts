import { IsNotEmpty } from 'class-validator';

export class StoreLoginPhoneValidation {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  phone: string;

  access_type: string;
}
