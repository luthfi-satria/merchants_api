import { Controller, Get, Query } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { StoreMultipickupService } from './stores-multipickup.service';

@Controller('api/v1/merchants')
export class StoreMultipickupsController {
  constructor(
    private readonly storeMultipickupService: StoreMultipickupService,
  ) {}

  @Get('/find-merchant-by-radius')
  @ResponseStatusCode()
  async findStoresByRadius(@Query() queryParam) {
    try {
      const findStores = await this.storeMultipickupService.findStoresByRadius(
        queryParam,
      );

      return findStores;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
