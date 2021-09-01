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
import { GroupUsersService } from './group_users.service';
import { MerchantGroupUsersValidation } from './validation/groups_users.validation';

@Controller('api/v1/merchants/groups')
export class GroupUsersController {
  constructor(private readonly groupUsersService: GroupUsersService) {}

  @Post(':gid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createGroupUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantGroupUsersValidation>,
    @Param('gid') groupId: string,
  ): Promise<any> {
    args.group_id = groupId;
    return await this.groupUsersService.createGroupUsers(args);
  }

  @Put(':gid/users/:uid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateGroupUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantGroupUsersValidation>,
    @Param('gid') groupId: string,
    @Param('uid') groupUserId: string,
  ): Promise<any> {
    args.group_id = groupId;
    args.id = groupUserId;
    return await this.groupUsersService.updateGroupUsers(args);
  }

  @Delete(':gid/users/:uid')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteGroupUsers(
    @Req() req: any,
    @Param('gid') groupId: string,
    @Param('uid') groupUserId: string,
  ): Promise<any> {
    const args: Partial<MerchantGroupUsersValidation> = {
      group_id: groupId,
      id: groupUserId,
    };
    return await this.groupUsersService.deleteGroupUsers(args);
  }

  @Get(':gid/users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listGroupUsers(
    @Req() req: any,
    @Query() data: Record<string, any>,
    @Param('gid') groupId: string,
  ): Promise<any> {
    const args: Partial<MerchantGroupUsersValidation> = {
      group_id: groupId,
      search: data.search,
      limit: data.limit,
      page: data.page,
    };
    return await this.groupUsersService.listGroupUsers(args);
  }
}
