import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommonStoresService } from 'src/common/own/stores.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { StoreBatchDTO } from './dto/store_batch.dto';
import { UpdateRatingDTO } from './dto/update_rating.dto';
import { InternalService } from './internal.service';
import { StoreDocument } from 'src/database/entities/store.entity';
import { GetMerchantUsersDto } from './dto/list_merchant_user.dto';
import { MerchantsBatchDTO } from './dto/merchant_batch.dto';
import { ListStoreDTO } from 'src/stores/validation/list-store.validation';
import { StoreCategoryBatchDTO } from './dto/store_category.dto';
import { RSuccessMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantStoresDto } from './dto/merchant_stores.dto';
import { GroupsService } from 'src/groups/groups.service';
import { StoresService } from 'src/stores/stores.service';
import { GetMerchantBulkDTO } from './dto/get-merchant-bulk.dto';

@Controller('api/v1/internal')
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly responseService: ResponseService,
    private readonly commonStoreService: CommonStoresService,
    private readonly messageService: MessageService,
    private readonly storeService: StoresService,
    private readonly merchantService: MerchantsService,
    private readonly groupService: GroupsService,
  ) {}

  @Get('merchants/merchant-users')
  @ResponseStatusCode()
  async getMerchantUsers(@Query() data: GetMerchantUsersDto): Promise<any> {
    return this.internalService.getMerchantUsers(data).catch((error) => {
      console.error(error);
      throw error;
    });
  }

  @Post('/merchants/stores/batchs')
  @ResponseStatusCode()
  async getBatchStores(
    @Body()
    storeBatchDTO: StoreBatchDTO,
  ): Promise<any> {
    const results = await this.commonStoreService.getAndValidateStoreByStoreIds(
      storeBatchDTO.store_ids,
      storeBatchDTO.user,
    );

    for (const result of results) {
      await this.storeService.manipulateStoreUrl(result);
      await this.merchantService.manipulateMerchantUrl(result.merchant);
      await this.groupService.manipulateGroupUrl(result.merchant.group);
    }
    return results;
  }

  @Get('merchants/merchants/batchs')
  @ResponseStatusCode()
  async getMerchantsWithGroupBulk(
    @Query() data: MerchantsBatchDTO,
  ): Promise<any> {
    const result = await this.internalService.getMerchantsWithGroupBulk(
      data.merchant_ids,
    );
    for (const merchant of result.merchants) {
      await this.merchantService.manipulateMerchantUrl(merchant);
      await this.groupService.manipulateGroupUrl(merchant.group);
    }
    return result;
  }

  @Get('merchants/stores')
  @ResponseStatusCode()
  async listStores(@Query() data: any): Promise<any> {
    return this.internalService.listStores(data);
  }

  @Get('merchants/groups')
  @ResponseStatusCode()
  async listGroups(@Query() data: any): Promise<any> {
    try {
      return this.internalService.listGroups(data);
    } catch (error) {
      console.error(error);
    }
  }

  @Post('merchants/stores/rating/:id')
  @ResponseStatusCode()
  async updateRatingStore(
    @Param('id') id: string,
    @Body()
    data: UpdateRatingDTO,
  ): Promise<any> {
    return this.internalService.updateRatingStore(id, data);
  }

  @Get('merchants/stores/:id')
  @ResponseStatusCode()
  async getStoresId(@Param('id') id: string): Promise<any> {
    const result = await this.internalService.findStorebyId(id);

    await this.storeService.manipulateStoreUrl(result);
    await this.merchantService.manipulateMerchantUrl(result.merchant);
    await this.groupService.manipulateGroupUrl(result.merchant.group);

    return result;
  }

  @Get('merchants/stores/level/:id')
  @ResponseStatusCode()
  async getStoreWithLevel(@Param('id') store_id: string): Promise<any> {
    const result = await this.internalService.findStoreLevel(store_id);

    await this.storeService.manipulateStoreUrl(result);
    await this.merchantService.manipulateMerchantUrl(result.merchant);
    await this.groupService.manipulateGroupUrl(result.merchant.group);

    return result;
  }

  @Post('merchants/stores/bylevel')
  @ResponseStatusCode()
  async listStoresByLevel(@Body() args: any): Promise<any> {
    const data: Partial<ListStoreDTO> = args.data;
    const user: any = args.user;
    return this.internalService.listStoreByLevel(data, user);
  }

  @Get('merchants/stores/by/automatic_refund')
  @ResponseStatusCode()
  async listStoresAutomaticRefund(): Promise<any> {
    const result = await this.internalService.findStoreAutomaticRefund();

    for (const data of result.data) {
      await this.storeService.manipulateStoreUrl(data);
      if (data.merchant) {
        await this.merchantService.manipulateMerchantUrl(data.merchant);
        if (data.merchant.group)
          await this.groupService.manipulateGroupUrl(data.merchant.group);
      }
    }

    return result;
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

  @Post('merchants/stores/platform')
  @ResponseStatusCode()
  async updatePlatform(
    @Body()
    args: Record<string, any>[],
  ): Promise<any> {
    console.log(args, '=> args controller platform');

    return this.internalService.updateStorePlatform(args);
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

  @Get('merchants/user/:id/:level')
  @ResponseStatusCode()
  async getMerchantUser(
    @Param('id') id: string,
    @Param('level') level: string,
  ): Promise<any> {
    return this.internalService.findMerchantUser({ id: id, level: level });
  }

  @Get('merchants/stores/active/:mid')
  @ResponseStatusCode()
  async getStoresActiveByMerchantId(
    @Param('mid') mid: string,
  ): Promise<Record<string, StoreDocument[]>> {
    try {
      const results = await this.internalService.findStoreActivebyMerchantId(
        mid,
      );

      for (const result of results) {
        await this.storeService.manipulateStoreUrl(result);
      }

      return {
        stores: results,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  @Get('merchants/merchants/stores/:merchant_id')
  @ResponseStatusCode()
  async getMerchantStores(
    @Param('merchant_id') merchant_id: string,
    @Query() data: MerchantStoresDto,
  ): Promise<any> {
    try {
      const results = await this.internalService.getMerchantStores(data);
      for (const result of results.items) {
        await this.storeService.manipulateStoreUrl(result);
      }
      return this.responseService.success(true, 'SUCCESS', results);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  @Post('merchants/store/categories/batch')
  @ResponseStatusCode()
  async getBatchStoreCategories(
    @Body()
    storeCategoryBatchDTO: StoreCategoryBatchDTO,
  ): Promise<RSuccessMessage> {
    const result = await this.internalService.getStoreByCategoryBulk(
      storeCategoryBatchDTO.store_category_ids,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Post('merchants/merchants/bulk')
  @ResponseStatusCode()
  async getMerchantBulk(
    @Body()
    getMerchantBulkDTO: GetMerchantBulkDTO,
  ): Promise<RSuccessMessage> {
    const result = await this.internalService.findMerchantUsers(
      getMerchantBulkDTO.data,
    );

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Post('merchants/stores/byids')
  @ResponseStatusCode()
  async getMerchantStoreByIds(@Body() body: any): Promise<any> {
    const store_ids = body.store_ids;
    return await this.storeService.findMerchantStoresByIds(store_ids);
  }
}
