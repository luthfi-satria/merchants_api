import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ViewStoreDetailDTO {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lang: string;
}
