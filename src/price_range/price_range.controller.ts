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
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Controller('api/v1/merchants')
export class PriceRangeController {
  constructor(
    private readonly priceRangeService: PriceRangeService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Post('price-range')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createGroupUsers(
    @Body()
    args: PriceRangeValidation,
  ): Promise<RSuccessMessage> {
    const createPriceRange = await this.priceRangeService.createPriceRange(
      args,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.createSuccess'),
      createPriceRange,
    );
  }

  @Put('price-range/:prid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateGroupUsers(
    @Body()
    args: Partial<PriceRangeValidation>,
    @Param('prid') princeRangeId: string,
  ): Promise<RSuccessMessage> {
    args.id = princeRangeId;
    const result = await this.priceRangeService.updatePriceRange(args);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.updateSuccess'),
      result,
    );
  }

  @Delete('price-range/:prid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteGroupUsers(
    @Param('prid') princeRangeId: string,
  ): Promise<RSuccessMessage> {
    const result = await this.priceRangeService.deletePriceRange(princeRangeId);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.deleteSuccess'),
      result,
    );
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
