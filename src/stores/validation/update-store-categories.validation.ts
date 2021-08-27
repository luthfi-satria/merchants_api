import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UpdateStoreCategoriesValidation {
  @IsUUID('all', { each: true, message: 'Data UUID tidak valid.' })
  @IsNotEmpty()
  category_ids: string[];

  @IsOptional()
  store_id: string;

  @IsOptional()
  payload: any;
}
