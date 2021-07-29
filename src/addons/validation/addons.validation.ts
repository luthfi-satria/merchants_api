import { IsNotEmpty } from 'class-validator';

export class MerchantAddonsValidation {
  @IsNotEmpty()
  name: string;
  id: string;
}
