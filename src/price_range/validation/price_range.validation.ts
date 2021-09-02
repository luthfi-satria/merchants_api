import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class PriceRangeValidation {
  @IsOptional()
  id: string;

  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsNotEmpty({ message: 'Simbol tidak boleh kosong' })
  symbol: string;

  @IsNotEmpty({ message: 'Price Low tidak boleh kosong' })
  @IsNumber({}, { message: 'Value Price Low bukan format angka' })
  price_low: number;

  @IsNotEmpty({ message: 'Price High tidak boleh kosong' })
  @IsNumber({}, { message: 'Value Price High bukan format angka' })
  price_high: number;

  @IsNumber()
  sequence: number;

  @IsOptional()
  search: string;

  @IsOptional()
  limit: string;

  @IsOptional()
  page: string;
}
