import { IsNotEmpty } from 'class-validator';

export class StoreCategoryBatchDTO {
  @IsNotEmpty()
  store_category_ids: string[];
}
