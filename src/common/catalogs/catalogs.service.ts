import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { CommonService } from '../common.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';

@Injectable()
export class CatalogsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  logger = new Logger();

  async getMenuByStoreId(id: string): Promise<any> {
    try {
      const resp = await firstValueFrom(
        this.httpService
          .get(
            `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/menu/${id}`,
          )
          .pipe(map((resp) => resp.data)),
      );

      return resp;
    } catch (e) {
      this.logger.error(
        `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/menu/${id}`,
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
