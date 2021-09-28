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
import { StoreUsersService } from './stores_users.service';
import { MerchantStoreUsersValidation } from './validation/store_users.validation';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { UpdateMerchantStoreUsersValidation } from './validation/update_store_users.validation';
import { ListMerchantStoreUsersValidation } from './validation/list_store_users.validation';

@Controller('api/v1/merchants/stores')
export class StoreUsersController {
  constructor(private readonly storeUsersService: StoreUsersService) {}

  @Post('users')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createStoreUsers(
    @Req() req: any,
    @Body()
    args: MerchantStoreUsersValidation,
  ): Promise<any> {
    return this.storeUsersService.createStoreUsers(args);
  }

  @Put('users/:uid')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateStoreUsers(
    @Req() req: any,
    @Body()
    args: UpdateMerchantStoreUsersValidation,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    args.id = storeUserId;
    return this.storeUsersService.updateStoreUsers(args);
  }

  @Delete('users/:uid')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteStoreUsers(
    @Req() req: any,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    const args: Partial<MerchantStoreUsersValidation> = {
      id: storeUserId,
    };
    return this.storeUsersService.deleteStoreUsers(args, req.user);
  }

  @Get('users/list')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listStoreUsers(
    @Req() req: any,
    @Query() data: ListMerchantStoreUsersValidation,
  ): Promise<any> {
    return this.storeUsersService.listStoreUsers(data, req.user);
  }
}
