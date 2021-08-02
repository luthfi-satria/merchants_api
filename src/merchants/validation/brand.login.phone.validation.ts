import { IsNotEmpty } from 'class-validator';

export class BrandLoginPhoneValidation {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  phone: string;

  access_type: string;
}
