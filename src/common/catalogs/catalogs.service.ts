import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, lastValueFrom, map } from 'rxjs';
import { CommonService } from '../common.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { AxiosResponse } from 'axios';
import {
  PriceCategoryDTO,
  PriceCategoryStoreDTO,
} from './dto/price_category.dto';

@Injectable()
export class CatalogsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  logger = new Logger();

  async getDiscount(data) {
    try {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/discount`;
      const post_request = this.httpService
        .post(url, data, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response = await lastValueFrom(post_request);

      const result = Object.keys(response).map((key) => response[key]);

      return result;
    } catch (error) {
      console.log(error);
    }
  }

  //** GET RECOMMENDED MENU ONLY */
  async getMenuRecommendedByStoreId(id: string, opt: any = {}): Promise<any> {
    try {
      const urlInternal = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/recommeded/${id}`;
      // const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/catalogs/query/menus/${id}`;
      const options: any = {
        limit: 100,
      };
      if (opt.search) {
        options.search = opt.search;
      }
      return await firstValueFrom(
        this.httpService
          .get(urlInternal, {
            params: options,
          })
          .pipe(map((resp) => resp.data)),
      );
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/recommeded/${id}`,
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

  //** GET MENU ONLY */
  async getMenuOnlyByStoreId(id: string, opt: any = {}): Promise<any> {
    try {
      const urlInternal = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/menuonly/${id}`;
      // const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/catalogs/query/menus/${id}`;
      const options: any = {
        limit: 100,
      };
      if (opt.search) {
        options.search = opt.search;
      }
      return await firstValueFrom(
        this.httpService
          .get(urlInternal, {
            params: options,
          })
          .pipe(map((resp) => resp.data)),
      );
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/menuonly/${id}`,
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

  async getMenuByStoreId(id: string, opt: any = {}): Promise<any> {
    try {
      const urlInternal = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/menu/${id}`;
      // const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/catalogs/query/menus/${id}`;
      const options: any = {
        limit: 100,
      };
      if (opt.search) {
        options.search = opt.search;
      }
      return await firstValueFrom(
        this.httpService
          .get(urlInternal, {
            params: options,
          })
          .pipe(map((resp) => resp.data)),
      );
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/catalogs/query/menus/${id}`,
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

  async getPriceCategoryByMerchantIds(
    merchantIds: string[],
  ): Promise<PriceCategoryDTO[]> {
    try {
      if (!merchantIds) {
        return null;
      }
      const params = {
        merchant_ids: merchantIds,
      };
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/price-category`;
      const post_request = this.httpService
        .post(url, params, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response: {
        success: string;
        message: string;
        data: PriceCategoryDTO[];
      } = await lastValueFrom(post_request);

      return response.data;
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/price-category`,
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

  async getPriceCategoryByStoreIds(
    storeIds: string[],
  ): Promise<PriceCategoryStoreDTO[]> {
    try {
      if (!storeIds) {
        return null;
      }
      const params = {
        store_ids: storeIds,
      };
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/store/price-category`;
      const post_request = this.httpService
        .post(url, params, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response: {
        success: string;
        message: string;
        data: PriceCategoryStoreDTO[];
      } = await lastValueFrom(post_request);

      return response.data;
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/store/price-category`,
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

  async getMenuIds(menuIds: string[]): Promise<any> {
    if (!(menuIds?.length > 0)) {
      return [];
    }

    const response = await firstValueFrom(
      this.httpService.get(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/menu/by/ids`,
        {
          params: {
            ids: menuIds,
          },
        },
      ),
    );

    console.log(response, 'RESPONSE GET MENU BY ID');

    return response?.data?.data;
  }
}
