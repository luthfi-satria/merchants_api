import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, lastValueFrom, map } from 'rxjs';
import { CommonService } from '../common.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { AxiosResponse } from 'axios';
import { PriceCategoryDTO } from './dto/price_category.dto';

@Injectable()
export class CatalogsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  logger = new Logger();

  async getMenuByStoreId(id: string, opt: any = {}): Promise<any> {
    try {
      const urlInternal = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/menu/${id}`;
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
}
