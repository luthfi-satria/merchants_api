import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  NotFoundException,
  Put,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import { ResponseService } from 'src/response/response.service';
import { StoresService } from 'src/stores/stores.service';
import { BanksStoreDto } from './validations/banks-store.dto';

@Controller('api/v1/merchants/banks/stores')
export class BanksStoresController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly storeService: StoresService,
  ) {}

  @Put()
  @UseInterceptors(AnyFilesInterceptor())
  async updateStoresBankData(
    @Body(new ValidationPipe({ transform: true })) body: BanksStoreDto,
  ) {
    try {
      const stores_ids = await this.storeService
        .findMerchantStoresByIds(body.store_ids)
        .then((res) => res.map((row) => row.id));

      if (stores_ids.length !== body.store_ids?.length) {
        const unknown_id = body.store_ids?.filter(
          (item) => !stores_ids.includes(item),
        );
        throw new NotFoundException(
          this.responseService.error(HttpStatus.NOT_FOUND, {
            constraint: [`'store_ids' id does not found!`],
            property: 'store_ids',
            value: unknown_id[0],
          }),
        );
      }

      const { bank_account_name, bank_account_no, bank_id } = body;
      const updateResult = await this.storeService
        .updateBulkStoresBankDetail(
          stores_ids,
          bank_account_name,
          bank_account_no,
          bank_id,
        )
        .then(async (res) => {
          if (res.affected == 0) {
            Logger.warn(
              'Update Success but did not change anything!',
              'Update Stores Bank',
            );
          }

          return this.storeService.findMerchantStoresByIds(stores_ids);
        });

      return this.responseService.success(
        true,
        'Success Update Merchant Store Bank Detail',
        updateResult,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Update Bank Data Stores');
      throw e;
    }
  }
}
