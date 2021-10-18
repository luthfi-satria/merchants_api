import { IsNotEmpty, IsOptional } from 'class-validator';

export class StoreBatchDTO {
  @IsNotEmpty()
  store_ids: string[];

  @IsOptional()
  user: any;
}
