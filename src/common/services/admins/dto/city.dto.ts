import { ProvinceDTO } from './province.dto';

export class CityDTO {
  id: string;
  province: ProvinceDTO;
  province_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}
