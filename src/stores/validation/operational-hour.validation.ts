import { IsBoolean, IsNotEmpty } from 'class-validator';

export class StoreOpenValidation {
  @IsNotEmpty()
  @IsBoolean()
  is_store_open: boolean;
}
