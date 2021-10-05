import {
  Body,
  Controller,
  Logger,
  Put,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import { ResponseService } from 'src/response/response.service';
import { StoresService } from 'src/stores/stores.service';
import { BanksService } from './banks.service';
import { BanksStoreDto } from './validations/banks-store.dto';

@Controller('api/v1/merchants/banks/stores')
export class BanksStoresController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly bankService: BanksService,
    private readonly storeService: StoresService,
  ) {}

  @Put()
  @UseInterceptors(AnyFilesInterceptor())
  async updateStoresBankData(
    @Body(new ValidationPipe({ transform: true })) body: BanksStoreDto,
  ) {
    try {
      const stores = await this.storeService.findMerchantStoresByIds(
        body.store_ids,
      );

      return this.responseService.success(
        true,
        'Success Update Bank Data',
        stores,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Update Bank Data Stores');
      throw e;
    }
  }
}
