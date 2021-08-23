import { Body, Controller, Logger, Param, Put } from '@nestjs/common';
import { ResponseService } from 'src/response/response.service';
import { StoreOperationalService } from './stores-operational.service';
import { IStoreOperationalPayload } from './types';

@Controller('api/v1/merchants/stores')
export class StoreOperationalController {
  constructor(
    private readonly mStoreOperationalService: StoreOperationalService,
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
    @Body() is_store_open: boolean,
  ) {
    try {
      const result = await this.mStoreOperationalService
        .updateStoreOpenStatus(id, is_store_open)
        .catch((e) => {
          throw e;
        });

      return this.responseService.success(
        true,
        'Sukses update status toko buka',
        result,
      );
    } catch (e) {
      Logger.error(e.message, '', 'Set Store Status');
      throw e;
    }
  }
}
