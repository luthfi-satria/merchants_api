import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { catchError, firstValueFrom, map } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { QueryService } from 'src/query/query.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class StoreMultipickupService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly httpService: HttpService,
    private readonly queryService: QueryService,
  ) {}

  private readonly logger = new Logger();

  async getElogSettings() {
    try {
      const result = {};
      const url: string =
        process.env.BASEURL_DELIVERIES_SERVICE +
        '/api/v1/deliveries/internal/elog/settings';

      const settings = await firstValueFrom(
        this.httpService.get(url).pipe(
          map((response) => response.data),
          catchError(() => {
            throw new ForbiddenException('Deliveries service is not available');
          }),
        ),
      );

      for (const Item in settings) {
        result[settings[Item].name] = JSON.parse(
          settings[Item].value.replace('{', '[').replace('}', ']'),
        );
      }

      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // FindStoresByRadiusQueryStatement
  findStoresByRadiusSelectStatement(lat, long) {
    const statement = `(6371 * ACOS(COS(RADIANS(${lat})) * COS(RADIANS(merchant_store.location_latitude)) 
    * COS(RADIANS(merchant_store.location_longitude) - RADIANS(${long})) + SIN(RADIANS(${lat})) 
    * SIN(RADIANS(merchant_store.location_latitude))))`;
    return statement;
  }

  async findStoresByRadius(param) {
    try {
      // Getting setting radius dari table deliveries_settings
      // prefix: elog_
      const elogSettings = await this.getElogSettings();
      const multipickupRadius = elogSettings
        ? parseInt(elogSettings['elog_multipickup_radius'][0])
        : 500;
      // const multipickupRadius = 1000;

      param.distance = multipickupRadius;

      const StoreList = await this.queryService.getStoreList(param);
      StoreList.data.items.forEach((row) => {
        delete row.service_addons;
        delete row.bank_id;
        delete row.bank_account_no;
        delete row.bank_account_name;
        delete row.created_at;
        delete row.updated_at;
        delete row.deleted_at;
        delete row.approved_at;
        delete row.rejected_at;
        delete row.rejection_reason;
      });

      return StoreList;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.listmerchant.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
