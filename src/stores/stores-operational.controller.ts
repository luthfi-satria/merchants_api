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
import { RoleStoreGuard } from 'src/auth/store.guard';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
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

  @Post('set-operational-hours')
  async updateOperationalHour(
    @Body(new ParseArrayPipe({ items: StoreOpenHoursValidation }))
    payload: StoreOpenHoursValidation[],
    @Req() req: any,
  ) {
    try {
      const { store_id } = req.user;

      const result = await this.mStoreOperationalService
        .updateStoreOperationalHours(store_id, payload)
        .then(async (res) => {
          console.log('set operational hour update result: ', res);
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

      return this.responseService.success(
        true,
        'Sukses update status toko buka',
        [],
      );
    } catch (e) {
      Logger.error(e.message, '', 'Set Store Status');
      throw e;
    }
  }
}
