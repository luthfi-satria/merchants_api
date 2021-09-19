import { CityDTO } from './city.dto';

export class CityResponseDTO {
  success: string;
  message: string;
  data: CityDTO;
  statusCode: number;
  error: string;
}
