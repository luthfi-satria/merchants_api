import { CountryDTO } from './country.dto';

export class ProvinceDTO {
  id: string;
  country: CountryDTO;
  country_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}
