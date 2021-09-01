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
import { StoreUsersService } from './stores_users.service';
import { MerchantStoreUsersValidation } from './validation/store_users.validation';

@Controller('api/v1/merchants/stores')
export class StoreUsersController {
  constructor(private readonly storeUsersService: StoreUsersService) {}

  @Post(':sid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createStoreUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantStoreUsersValidation>,
    @Param('sid') storeId: string,
  ): Promise<any> {
    args.store_id = storeId;
    return await this.storeUsersService.createStoreUsers(args);
  }

  @Put(':sid/users/:uid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateStoreUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantStoreUsersValidation>,
    @Param('sid') storeId: string,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    args.store_id = storeId;
    args.id = storeUserId;
    return await this.storeUsersService.updateStoreUsers(args);
  }

  @Delete(':sid/users/:uid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteStoreUsers(
    @Req() req: any,
    @Param('sid') storeId: string,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    const args: Partial<MerchantStoreUsersValidation> = {
      store_id: storeId,
      id: storeUserId,
    };
    return await this.storeUsersService.deleteStoreUsers(args);
  }

  @Get(':sid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listStoreUsers(
    @Req() req: any,
    @Query() data: Record<string, any>,
    @Param('sid') storeId: string,
  ): Promise<any> {
    const args: Partial<MerchantStoreUsersValidation> = {
      store_id: storeId,
      search: data.search,
      limit: data.limit,
      page: data.page,
    };
    return await this.storeUsersService.listStoreUsers(args);
  }
}
