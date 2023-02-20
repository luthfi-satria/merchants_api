import { IsArray, IsEmail, IsInt, IsString } from 'class-validator';

export class ssoBusinessDocuments {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  bio: string;

  @IsString()
  location: string;

  @IsString()
  slogan: string;

  @IsString()
  etags: string;

  @IsString()
  profile_picture: string;

  @IsString()
  phone: string;

  @IsString()
  url: string;

  @IsInt()
  level: number;

  @IsInt()
  parent_id: number;

  @IsInt()
  owner: number;

  @IsString()
  type: string;

  @IsInt()
  approval: number;

  @IsArray()
  open_day: string[];

  @IsString()
  open_hour: string;

  @IsString()
  close_hour: string;

  @IsInt()
  is_open: number;

  @IsInt()
  status: number;

  @IsInt()
  id_role: number;

  @IsString()
  label: string;

  @IsString()
  nameAddress: string;

  @IsString()
  phoneAddress: string;

  @IsString()
  description: string;

  @IsString()
  full_address: string;

  @IsInt()
  id_country: number;

  @IsInt()
  id_provinsi: number;

  @IsInt()
  id_kabupaten: number;

  @IsInt()
  id_kecamatan: number;

  @IsInt()
  id_kelurahan: number;

  @IsString()
  postal_code: string;

  @IsString()
  longitude: string;

  @IsString()
  latitude: string;
}
