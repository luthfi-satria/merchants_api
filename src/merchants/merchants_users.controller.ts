import {
  Body,
  Controller,
  Post,
  Put,
  Param,
  Delete,
  Get,
  Req,
  Query,
} from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MerchantUsersService } from './merchants_users.service';
import { MerchantMerchantUsersValidation } from './validation/merchants_users.validation';

@Controller('api/v1/merchants/merchants')
export class MerchantUsersController {
  constructor(private readonly merchantUsersService: MerchantUsersService) {}

  @Post(':mid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createMerchantUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantMerchantUsersValidation>,
    @Param('mid') merchantId: string,
  ): Promise<any> {
    args.merchant_id = merchantId;
    return await this.merchantUsersService.createMerchantUsers(args);
  }

  @Put(':mid/users/:uid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantMerchantUsersValidation>,
    @Param('mid') merchantId: string,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    args.merchant_id = merchantId;
    args.id = merchantUserId;
    return await this.merchantUsersService.updateMerchantUsers(args);
  }

  @Delete(':mid/users/:uid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteMerchantUsers(
    @Req() req: any,
    @Param('mid') merchantId: string,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    const args: Partial<MerchantMerchantUsersValidation> = {
      merchant_id: merchantId,
      id: merchantUserId,
    };
    return await this.merchantUsersService.deleteMerchantUsers(args);
  }

  @Get(':mid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listMerchantUsers(
    @Req() req: any,
    @Query() data: Record<string, any>,
    @Param('mid') merchantId: string,
  ): Promise<any> {
    const args: Partial<MerchantMerchantUsersValidation> = {
      merchant_id: merchantId,
      search: data.search,
      limit: data.limit,
      page: data.page,
    };
    return await this.merchantUsersService.listMerchantUsers(args);
  }
}