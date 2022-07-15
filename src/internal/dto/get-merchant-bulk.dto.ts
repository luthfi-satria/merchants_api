import { ArrayMinSize, IsArray } from 'class-validator';
import { GetMerchantBulkDataDTO } from './get-merchant-bulk-data.dto';

export class GetMerchantBulkDTO {
  @IsArray()
  @ArrayMinSize(1)
  data: GetMerchantBulkDataDTO[];
}
