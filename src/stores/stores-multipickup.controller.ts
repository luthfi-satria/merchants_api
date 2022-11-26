import { Controller, Get, Query } from '@nestjs/common';
import { QueryListStoreDto } from 'src/query/validation/query-public.dto';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { StoreMultipickupService } from './stores-multipickup.service';

@Controller('api/v1/merchants')
export class StoreMultipickupsController {
  constructor(
    private readonly storeMultipickupService: StoreMultipickupService,
  ) {}

  @Get('/find-merchant-by-radius')
  @ResponseStatusCode()
  async findStoresByRadius(@Query() queryParam: QueryListStoreDto) {
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
