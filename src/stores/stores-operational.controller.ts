import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { RoleStoreGuard } from 'src/auth/store.guard';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { StoreOperationalService } from './stores-operational.service';
import { StoresService } from './stores.service';
import {
  StoreOpen24HourValidation,
  StoreOpenHoursValidation,
  StoreOpenValidation,
} from './validation/operational-hour.validation';

@Controller('api/v1/merchants/stores')
@UseGuards(RoleStoreGuard)
export class StoreOperationalController {
  private GMT_Offset = 0; // UTC/GMT +0

  constructor(
    private readonly mStoreOperationalService: StoreOperationalService,
    private readonly mStoreService: StoresService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  // @UseGuards(RoleStoreGuard)
  @Post('set-operational-hours/:store_id')
  @UserTypeAndLevel('admin.*', 'merchant.store')
  async updateOperationalHour(
    @Param('store_id') store_id: string,
    @Body()
    payload: StoreOpenHoursValidation,
  ) {
    try {
      const { gmt_offset, operational_hours } = payload;

      //populate store schedules if does not exists
      let ifSchedulesExists =
        await this.mStoreOperationalService.getAllStoreScheduleByStoreId(
          store_id,
        );
      if (ifSchedulesExists.length == 0) {
        Logger.log(
          'Operational store hour does not exists. proceed to populate schedules',
          'Populate store operational hour',
        );
        ifSchedulesExists =
          await this.mStoreOperationalService.createStoreOperationalHours(
            store_id,
            payload.gmt_offset,
          );
      }

      //parse from validation to entity class
      const updPayload = operational_hours.map((e) => {
        const shifts = e.operational_hours.map((element) => {
          const { open_hour, close_hour } = element;
          if (!open_hour || !close_hour) {
            const errors: RMessage = {
              value: '',
              property: !open_hour ? 'open_hour' : 'close_hour',
              constraint: [
                this.messageService.get('merchant.updatestore.invalid_hour'),
              ],
            };
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                errors,
                'Bad Request',
              ),
            );
          }

          //Convert and save to UTC+0
          const utc_openHour = DateTimeUtils.convertTimeToUTC(
            open_hour,
            gmt_offset,
          );
          const utc_closeHour = DateTimeUtils.convertTimeToUTC(
            close_hour,
            gmt_offset,
          );

          console.log(`utc convert: ${utc_openHour} ${utc_closeHour}`);

          return new StoreOperationalShiftDocument({
            open_hour: utc_openHour,
            close_hour: utc_closeHour,
          });
        });

        //convert day of week into int
        const dayOfWeek = DateTimeUtils.convertToDayOfWeekNumber(e.day_of_week);

        return new StoreOperationalHoursDocument({
          gmt_offset: gmt_offset,
          merchant_store_id: store_id,
          day_of_week: dayOfWeek,
          is_open_24h: e.open_24hrs,
          is_open: e.is_open,
          shifts: shifts,
        });
      });

      // Merge & format input data with existing data, to support cascade update.
      const parsedValue =
        await this.mStoreOperationalService.parseOldExistingSchedules(
          ifSchedulesExists,
          updPayload,
        );

      const result = await this.mStoreOperationalService
        .updateStoreOperationalHours(store_id, parsedValue)
        .then(() => {
          return this.mStoreOperationalService
            .getAllStoreScheduleByStoreId(store_id)
            .catch((e) => {
              throw e;
            });
        });

      const formatted = result.map((item) => {
        const fmtShift = item.shifts.map((ee) => {
          return new StoreOperationalShiftDocument({
            open_hour: ee.open_hour,
            close_hour: ee.close_hour,
          });
        });

        return new StoreOperationalHoursDocument({
          ...item,
          day_of_week: DateTimeUtils.convertToDayOfWeek(
            Number(item.day_of_week),
          ),
          shifts: fmtShift,
        });
      });

      return this.responseService.success(
        true,
        'Sukses Update Jam Operasi toko',
        formatted,
      );
    } catch (e) {
      Logger.error(e.message, '', 'Set Store Operational Hour');
      throw e;
    }
  }

  @Post('set-open-24h')
  @UserTypeAndLevel('merchant.store')
  @UseGuards(RoleStoreGuard)
  async updateStoreOpen24hours(
    @Body(new ValidationPipe({ transform: true }))
    data: StoreOpen24HourValidation,
    @Req() req: any,
  ) {
    try {
      const { store_id } = req.user;
      const { is_open_24_hour } = data;

      await this.mStoreService
        .getMerchantStoreDetailById(store_id)
        .catch((e) => {
          throw e;
        })
        .then(async (res) => {
          if (res.operational_hours.length == 0) {
            throw new NotFoundException(
              'Store tidak memiliki jadwal operasional',
              'Not Found',
            );
          }

          // update 24 hour flag in merchant store
          const store = this.mStoreService.createInstance({
            ...res,
            is_open_24h: is_open_24_hour,
          });
          delete store.operational_hours;
          // delete store.service_addon;

          await this.mStoreService.updateStoreProfile(store).catch((e) => {
            throw e;
          });

          if (is_open_24_hour) {
            return Promise.all(
              res.operational_hours.map(async (e) => {
                return this.mStoreOperationalService.forceAllScheduleToOpen(
                  e.id,
                );
              }),
            ).catch((e) => {
              throw e;
            });
          } else {
            return Promise.all(
              res.operational_hours.map(async (row) => {
                return this.mStoreOperationalService
                  .resetScheduleToDefault(row.id)
                  .catch((e) => {
                    throw e;
                  });
              }),
            );
          }
        });

      const updatedResult = await this.mStoreService
        .getMerchantStoreDetailById(store_id)
        .catch((e) => {
          throw e;
        });

      const msg = is_open_24_hour
        ? `Sukses mengubah status toko menjadi 'Buka 24 Jam'`
        : `Sukses mereset status 'Buka 24 Jam', sekarang toko mengikuti jadwal operasional toko.`;

      return this.responseService.success(true, msg, updatedResult);
    } catch (e) {
      Logger.error(e.message, '', 'Update Store 24h');
      throw e;
    }
  }

  @Post('set-store-open/:store_id')
  @UserTypeAndLevel('admin.*', 'merchant.store')
  @UseGuards(RoleStoreGuard)
  async updateStoreOpenStatus(
    @Param('store_id') store_id: string,
    @Body(new ValidationPipe({ transform: true })) data: StoreOpenValidation,
    @Req() req: any,
  ) {
    try {
      const { is_store_open } = data;

      const result = await this.mStoreOperationalService
        .updateStoreOpenStatus(store_id, is_store_open)
        .catch((e) => {
          throw e;
        });

      if (result.affected == 0) {
        const errors = this.messageService.get(
          'merchant.updatestore.id_notfound',
        );
        throw new NotFoundException(errors, 'Update open store failed');
      }

      const updatedResult = await this.mStoreService
        .getMerchantStoreDetailById(store_id)
        .catch((e) => {
          throw e;
        });

      return this.responseService.success(
        true,
        'Sukses update status toko buka',
        [updatedResult],
      );
    } catch (e) {
      Logger.error(e.message, '', 'Set Store Status');
      throw e;
    }
  }
}
