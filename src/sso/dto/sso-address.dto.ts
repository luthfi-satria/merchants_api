import { IsBoolean, IsInt, IsString } from 'class-validator';

export class ssoAddressDocument {
  @IsInt()
  address_eshop_id: number;
  @IsString()
  label: string;
  @IsString()
  label_owner: string;
  @IsString()
  phone: string;
  @IsString()
  notes: string;
  @IsBoolean()
  is_primary: string;
  @IsString()
  address: string;
  @IsString()
  kode_pos: string;
  @IsString()
  latitude: string;
  @IsString()
  longitude: string;
  @IsString()
  label_latitude_longitude: string;
  @IsString()
  detail_label_latitude_longitude: string;
  @IsInt()
  provinsi: number;
  @IsInt()
  kabupaten: number;
  @IsInt()
  kecamatan: number;
  @IsInt()
  kelurahan: number;
}
