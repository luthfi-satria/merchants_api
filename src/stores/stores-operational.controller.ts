import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { RoleStoreGuard } from 'src/auth/store.guard';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { StoreOperationalService } from './stores-operational.service';
import {
  StoreOpenHoursValidation,
  StoreOpenValidation,
} from './validation/operational-hour.validation';

@Controller('api/v1/merchants/stores')
@UseGuards(RoleStoreGuard)
export class StoreOperationalController {
  constructor(
    private readonly mStoreOperationalService: StoreOperationalService,
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
            .getAllStoreScheduleById(store_id)
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
