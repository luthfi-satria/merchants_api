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
      const url = `${process.env.BASEURL_ORDERS_SERVICE}/master/area/province?name=&page=1&limit=1000`;
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
        `https://dev-api.elog.co.id/master/area/province?name=&page=1&limit=1000`,
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

  async checkInuseStatus(user: any): Promise<CountOrdersStoresDTO[]> {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const url = `https://dev-api.elog.co.id/api/v1/orders/internal/cashier/inuse-status`;
      const post_request = this.httpService
        .post(url, user, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      return await lastValueFrom(post_request);
    } catch (e) {
      this.logger.error(
        `https://dev-api.elog.co.id/api/v1/orders/internal/cashier/inuse-status`,
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
