import { IsNotEmpty } from 'class-validator';

export class MerchantsBatchDTO {
  @IsNotEmpty()
  merchant_ids: string[];
}
