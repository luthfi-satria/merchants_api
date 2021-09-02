import {
  Body,
  Controller,
  Post,
  Put,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { PriceRangeService } from './price_range.service';
import { PriceRangeValidation } from './validation/price_range.validation';

@Controller('api/v1/merchants')
export class PriceRangeController {
  constructor(private readonly priceRangeService: PriceRangeService) {}

  @Post('price-range')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createGroupUsers(
    @Body()
    args: Partial<PriceRangeValidation>,
  ): Promise<any> {
    return await this.priceRangeService.createPriceRange(args);
  }

  @Put('price-range/:prid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateGroupUsers(
    @Body()
    args: Partial<PriceRangeValidation>,
    @Param('prid') princeRangeId: string,
  ): Promise<any> {
    args.id = princeRangeId;
    return await this.priceRangeService.updatePriceRange(args);
  }

  @Delete('price-range/:prid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteGroupUsers(@Param('prid') princeRangeId: string): Promise<any> {
    const args: Partial<PriceRangeValidation> = {
      id: princeRangeId,
    };
    return await this.priceRangeService.deletePriceRange(args);
  }

  @Get('price-range')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listGroupUsers(
    @Query() data: Record<string, any>,
    @Param('prid') princeRangeId: string,
  ): Promise<any> {
    const args: Partial<PriceRangeValidation> = {
      id: princeRangeId,
      search: data.search,
      limit: data.limit,
      page: data.page,
    };
    return await this.priceRangeService.listPriceRange(args);
  }
}
