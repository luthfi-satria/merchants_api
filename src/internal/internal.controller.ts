import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CommonStoresService } from 'src/common/own/stores.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { StoreBatchDTO } from './dto/store_batch.dto';
import { InternalService } from './internal.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    private readonly commonStoreService: CommonStoresService,
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
    return await this.internalService.findMerchantbyId(id);
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
}
