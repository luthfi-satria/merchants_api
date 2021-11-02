import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CommonStoresService } from 'src/common/own/stores.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { StoreBatchDTO } from './dto/store_batch.dto';
import { InternalService } from './internal.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { StoreDocument } from 'src/database/entities/store.entity';

@Controller('api/v1/internal')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    private readonly commonStoreService: CommonStoresService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('/merchants/stores/batchs')
  @ResponseStatusCode()
  async getBatchStores(
    @Body()
    storeBatchDTO: StoreBatchDTO,
  ): Promise<any> {
    return this.commonStoreService.getAndValidateStoreByStoreIds(
      storeBatchDTO.store_ids,
      storeBatchDTO.user,
    );
  }

  @Get('merchants/stores/:id')
  @ResponseStatusCode()
  async getStoresId(@Param('id') id: string): Promise<any> {
    return this.internalService.findStorebyId(id);
  }

  @Get('merchants/:id')
  @ResponseStatusCode()
  async getMerchantId(@Param('id') id: string): Promise<any> {
    return this.internalService.findMerchantbyId(id);
  }

  @Post('merchants/stores/average-price')
  @ResponseStatusCode()
  async updateAveragePrice(
    @Body()
    args: Record<string, any>[],
  ): Promise<any> {
    return this.internalService.updateStoreAveragePrice(args);
  }

  @Get('merchants/profile/:id/check-active-role')
  @ResponseStatusCode()
  async getMerchantActiveRole(@Param('id') id: string) {
    try {
      const result = await this.internalService.checkIsActiveRole(id);
      return this.responseService.success(true, 'Success!', { data: result });
    } catch (e) {
      Logger.error(`ERROR ${e.message} `, '', 'Internal Check Active Role');
      throw e;
    }
  }

  @Get('stores/active/:mid')
  @ResponseStatusCode()
  async getStoresActiveByMerchantId(
    @Param('mid') mid: string,
  ): Promise<Record<string, StoreDocument[]>> {
    try {
      const result = await this.internalService.findStoreActivebyMerchantId(
        mid,
      );
      return {
        stores: result,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
