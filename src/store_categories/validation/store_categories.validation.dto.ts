import {
  IsBooleanString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { LanguageDocument } from 'src/database/entities/language.entity';

export class StoreCategoriesValidation {
  @IsOptional()
  created_at: string | Date;

  @IsOptional()
  updated_at: string | Date;

  @IsNotEmpty({ message: 'Nama Bahasa Indonesia kosong.' })
  name_id: string;

  @IsNotEmpty({ message: 'Nama Bahasa Inggris kosong.' })
  name_en: string;

  @IsBooleanString({ message: 'Masukkan data boolean.' })
  active: string;

  @IsOptional()
  image: string;

  @IsOptional()
  id: string;

  @IsOptional()
  search: string;

  @IsNotEmpty()
  sequence: number;

  @IsOptional()
  @IsNumber({}, { message: 'Data limit bukan angka' })
  limit: number;

  @IsOptional()
  @IsNumber({}, { message: 'Data page bukan angka' })
  page: number;

  @IsOptional()
  languages: Partial<LanguageDocument>[];

  @IsOptional()
  lang: string;
}
