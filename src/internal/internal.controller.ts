import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { InternalService } from './internal.service';

@Controller('api/v1/internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Get('merchants/stores/:id')
  @ResponseStatusCode()
  async getStoresId(@Param('id') id: string): Promise<any> {
    return await this.internalService.findStorebyId(id);
  }

  @Post('merchants/stores/average-price')
  @ResponseStatusCode()
  async updateAveragePrice(
    @Body()
    args: Record<string, any>[],
  ): Promise<any> {
    return await this.internalService.updateStoreAveragePrice(args);
  }
}
