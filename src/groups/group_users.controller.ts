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

import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { GroupUsersService } from './group_users.service';
import { MerchantGroupUsersValidation } from './validation/groups_users.validation';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import { ListGroupUserDTO } from './validation/list-group-user.validation';
import { RSuccessMessage } from 'src/response/response.interface';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

@Controller('api/v1/merchants/groups')
export class GroupUsersController {
  constructor(
    private readonly groupUsersService: GroupUsersService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('users')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createGroupUsers(
    @Req() req: any,
    @Body()
    args: MerchantGroupUsersValidation,
  ): Promise<any> {
    await this.groupUsersService.isCanModifDataValidation(
      req.user,
      args.group_id,
    );

    if (req.user.user_type != 'admin') {
      args.status = MerchantUsersStatus.Waiting_for_approval;
    }

    const result = await this.groupUsersService.createGroupUsers(args);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
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

  @Get('users')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listGroupUsers(
    @Query() listGroupUserDTO: ListGroupUserDTO,
  ): Promise<RSuccessMessage> {
    const listGroupUsers = await this.groupUsersService.listGroupUsers(
      listGroupUserDTO,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      listGroupUsers,
    );
  }
}
