import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { AxiosResponse } from 'axios';
import { CountOrdersStoresDTO } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly httpService: HttpService) {}

  logger = new Logger();

  async getFavoriteStoreThisWeek(): Promise<CountOrdersStoresDTO[]> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const url = `${process.env.BASEURL_ORDERS_SERVICE}/api/v1/orders/internal/most-order-store-this-weeks`;
      const post_request = this.httpService
        .post(url, null, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response: {
        success: string;
        message: string;
        data: CountOrdersStoresDTO[];
      } = await lastValueFrom(post_request);

      return response.data;
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_ORDERS_SERVICE}/api/v1/orders/internal/most-order-store-this-week`,
      );
      if (e.response) {
        throw new HttpException(
          e.response.data.message,
          e.response.data.statusCode,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
