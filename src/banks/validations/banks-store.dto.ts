import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsString,
} from 'class-validator';

export class BanksStoreDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  store_ids: string[];

  @IsNotEmpty()
  bank_id: string;

  @IsNotEmpty()
  @IsNumberString()
  bank_account_no: string;

  @IsNotEmpty()
  bank_account_name: string;
}
