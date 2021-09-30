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
import { MerchantUsersValidation } from './validation/merchants_users.validation';
import { HttpService } from '@nestjs/axios';

@Controller('api/v1/merchants/merchants')
export class MerchantUsersController {
  constructor(
    private readonly merchantUsersService: MerchantUsersService,
    private readonly httpService: HttpService,
  ) {}

  @Post(':mid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createMerchantUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantUsersValidation>,
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
    args: Partial<MerchantUsersValidation>,
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
    const args: Partial<MerchantUsersValidation> = {
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
    @Query() data: Record<string, any>,
    @Param('mid') merchantId: string,
  ): Promise<any> {
    const args: Partial<MerchantUsersValidation> = {
      merchant_id: merchantId,
      search: data.search,
      limit: data.limit,
      page: data.page,
    };

    return this.merchantUsersService.listMerchantUsers(args);
  }
}
