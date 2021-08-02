import { IsNotEmpty } from 'class-validator';

export class GroupLoginPhoneValidation {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  phone: string;

  access_type: string;
}
