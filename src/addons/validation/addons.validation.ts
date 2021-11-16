import { IsNotEmpty } from 'class-validator';

export class MerchantAddonsValidation {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  code: string;

  sequence: number;
  id: string;
}
