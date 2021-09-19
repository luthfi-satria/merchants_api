import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CommonService } from 'src/common/common.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { CityResponseDTO } from './dto/city-response.dto';
import { CityDTO } from './dto/city.dto';

@Injectable()
export class CityService {
  constructor(
    private readonly httpService: HttpService,
    @Message() private readonly messageService: MessageService,
    @Response() private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
  ) {}

  logger = new Logger();

  async getCity(city_id: string): Promise<CityDTO> {
    if (!city_id) {
      return null;
    }
    try {
      const url: string =
        process.env.BASEURL_ADMINS_SERVICE +
        '/api/v1/admins/internal/cities/' +
        city_id;
      const post_request = this.httpService
        .post(url, null, { headers: null })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
          catchError((err) => {
            this.logger.error(err);
            throw err;
          }),
        );
      const response_city_id: CityResponseDTO = await lastValueFrom(
        post_request,
      );
      if (!response_city_id) {
        const error_message: RMessage = {
          value: city_id,
          property: 'city_id',
          constraint: [this.messageService.get('address.city_id.not_found')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            error_message,
            'Bad Request',
          ),
        );
      }
      return response_city_id.data;
    } catch (error) {
      throw new BadRequestException(error.response.data);
    }
  }
}
