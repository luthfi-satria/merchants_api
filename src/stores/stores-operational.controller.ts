import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Param,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { StoreOperationalService } from './stores-operational.service';
import { IStoreOperationalPayload } from './types';
import { StoreOpenValidation } from './validation/operational-hour.validation';

@Controller('api/v1/merchants/stores')
export class StoreOperationalController {
  constructor(
    private readonly mStoreOperationalService: StoreOperationalService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Put(':store_id/set-operational-hours')
  async updateOperationalHour(
    @Body() payload: IStoreOperationalPayload[],
    @Param('store_id') id: string,
  ) {
    try {
      const result = await this.mStoreOperationalService
        .updateStoreOperationalHours(id, payload)
        .then(async (res) => {
          console.log('set operational hour update result: ', res);
          return await this.mStoreOperationalService
            .getAllStoreScheduleById(id)
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

  @Put(':id/set-store-open')
  async updateStoreOpenStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) data: StoreOpenValidation,
  ) {
    try {
      const { is_store_open } = data;

      const result = await this.mStoreOperationalService
        .updateStoreOpenStatus(id, is_store_open)
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
