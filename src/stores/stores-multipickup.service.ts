import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, firstValueFrom, map } from 'rxjs';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { QueryService } from 'src/query/query.service';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { dbOutputTime } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';

@Injectable()
export class StoreMultipickupService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    @InjectRepository(StoreDocument)
    private readonly storeRepo: Repository<StoreDocument>,
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
      const limit = param.limit || 10;
      const page = param.page || 1;
      const offset = (page - 1) * limit;
      const open_24_hour = param.is_24hrs || false;
      const store_category_id: string = param.store_category_id || null;
      const currTime = DateTimeUtils.DateTimeToUTC(new Date());
      const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();
      const lang = param.lang || 'id';

      // Getting setting radius dari table deliveries_settings
      // prefix: elog_
      const elogSettings = await this.getElogSettings();
      const multipickupRadius = elogSettings
        ? parseInt(elogSettings['elog_multipickup_radius'][0])
        : 500;

      const radius = multipickupRadius / 1000;
      const addSelectStatement = this.findStoresByRadiusSelectStatement(
        param.latitude,
        param.longitude,
      );
      const query = this.storeRepo
        .createQueryBuilder('merchant_store')
        .addSelect(addSelectStatement, 'distance_in_km')
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
        .leftJoinAndSelect(
          'operational_hours.shifts',
          'operational_shifts',
          'operational_shifts.store_operational_id = operational_hours.id',
        )
        .leftJoinAndSelect(
          'merchant_store.store_categories',
          'merchant_store_categories',
        )
        .leftJoinAndSelect(
          'merchant_store_categories.languages',
          'merchant_store_categories_languages',
          'merchant_store_categories_languages.lang = :lang',
          { lang: lang },
        )
        .where(
          '(6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(merchant_store.location_latitude)) * COS(RADIANS(merchant_store.location_longitude) - RADIANS(:long)) + SIN(RADIANS(:lat)) * SIN(RADIANS(merchant_store.location_latitude)))) <= :radius',
          {
            radius: radius,
            lat: param.latitude,
            long: param.longitude,
          },
        )
        .andWhere('merchant_store.status = :status', { status: param.status })
        .andWhere(
          new Brackets((qb) => {
            qb.where('operational_hours.day_of_week = :weekOfDay', {
              weekOfDay: weekOfDay,
            });
            qb.andWhere(
              new Brackets((sqb) => {
                sqb.where('operational_hours.is_open_24h = :is_open_24h', {
                  is_open_24h: open_24_hour,
                });
                sqb.orWhere(
                  ':currTime BETWEEN operational_shifts.open_hour AND operational_shifts.close_hour',
                  {
                    currTime: currTime,
                  },
                );
              }),
            );
          }),
        );

      if (store_category_id) {
        query.andWhere('merchant_store_categories.id = :storeCat', {
          storeCat: store_category_id,
        });
      }

      query.orderBy('distance_in_km', 'ASC').limit(limit).offset(offset);

      const queryResult = await query.getRawMany().catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [
                this.messageService.get('merchant.liststore.not_found'),
              ],
            },
            'Bad Request',
          ),
        );
      });
      const items = await this.queryService.manipulateStoreDistance2(
        queryResult,
        lang,
      );
      queryResult.forEach((row) => {
        dbOutputTime(row);
        delete row.owner_password;
      });

      return this.responseService.success(
        true,
        this.messageService.get('merchant.liststore.success'),
        items,
      );
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
