import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  ParseArrayPipe,
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
  constructor(
    private readonly mStoreOperationalService: StoreOperationalService,
    private readonly mStoreService: StoresService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(RoleStoreGuard)
  @Post('set-operational-hours')
  @UserTypeAndLevel('admin.*', 'merchant.store')
  async updateOperationalHour(
    @Body(new ParseArrayPipe({ items: StoreOpenHoursValidation }))
    payload: StoreOpenHoursValidation[],
    @Req() req: any,
  ) {
    try {
      const { store_id } = req.user;

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
          );
      }

      //parse from validation to entity class
      const updPayload = payload.map((e) => {
        const shifts = e.operational_hours.map((e) => {
          const item = new StoreOperationalShiftDocument({
            shift_id: e.shift_id,
            is_active: e.is_active,
            open_hour: e.open_hour,
            close_hour: e.close_hour,
          });
          if (e.id && e.id !== '') {
            item.id = e.id;
          }
          return item;
        });

        //convert day of week into int
        const dayOfWeek = DateTimeUtils.convertToDayOfWeekNumber(e.day_of_week);

        return new StoreOperationalHoursDocument({
          merchant_store_id: store_id,
          day_of_week: dayOfWeek,
          is_open_24h: e.open_24hrs,
          // is_open: e.is_open, // niel- comment first
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
        .then(async (res) => {
          return await this.mStoreOperationalService
            .getAllStoreScheduleByStoreId(store_id)
            .catch((e) => {
              throw e;
            });
        });

      return this.responseService.success(
        true,
        'Sukses Update Jam Operasi toko',
        result,
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

      const result = await this.mStoreService
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
          delete store.service_addon;

          await this.mStoreService.updateStoreProfile(store).catch((e) => {
            throw e;
          });

          if (is_open_24_hour) {
            const x = await Promise.all(
              res.operational_hours.map(async (e) => {
                return await this.mStoreOperationalService.forceAllScheduleToOpen(
                  e.id,
                );
              }),
            ).catch((e) => {
              throw e;
            });

            return x;
          } else {
            const y = await Promise.all(
              res.operational_hours.map(async (row) => {
                return await this.mStoreOperationalService
                  .resetScheduleToDefault(row.id)
                  .catch((e) => {
                    throw e;
                  });
              }),
            );

            return y;
          }
        });

      const updatedResult = await this.mStoreService
        .getMerchantStoreDetailById(store_id)
        .catch((e) => {
          throw e;
        });

      const msg = is_open_24_hour
        ? 'Sukses ubah semua jam operasional toko menjadi buka 24 jam'
        : `Sukses reset semua jam operasional mnejadi default (08:00 - 17:00)`;

      return this.responseService.success(true, msg, updatedResult);
    } catch (e) {
      Logger.error(e.message, '', 'Update Store 24h');
      throw e;
    }
  }

  @Post('set-store-open')
  @UserTypeAndLevel('merchant.store')
  @UseGuards(RoleStoreGuard)
  async updateStoreOpenStatus(
    @Body(new ValidationPipe({ transform: true })) data: StoreOpenValidation,
    @Req() req: any,
  ) {
    try {
      const { store_id } = req.user;
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
