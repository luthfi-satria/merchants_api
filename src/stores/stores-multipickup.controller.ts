import { Controller, Get, Query } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { StoreMultipickupService } from './stores-multipickup.service';

@Controller('api/v1/merchants')
export class StoreMultipickups {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly storeMultipickupService: StoreMultipickupService,
  ) {}

  @Get('/find-merchant-by-radius')
  @ResponseStatusCode()
  async findStoresByRadius(@Query() queryParam) {
    try {
      const findStores = await this.storeMultipickupService.findStoresByRadius(
        queryParam,
      );

      return this.responseService.success(
        true,
        this.messageService.get('merchant.listmerchant.success'),
        findStores,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
