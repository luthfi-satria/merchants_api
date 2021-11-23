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
import {
  MerchantGroupUsersValidation,
  UpdateMerchantGroupUsersValidation,
} from './validation/groups_users.validation';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { ListGroupUserDTO } from './validation/list-group-user.validation';
import { RSuccessMessage } from 'src/response/response.interface';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';
import { UpdatePhoneGroupUsersValidation } from './validation/update_phone_group_users.validation';
import { UpdateEmailGroupUsersValidation } from './validation/update_email_group_users.validation';

@Controller('api/v1/merchants/groups')
export class GroupUsersController {
  constructor(
    private readonly groupUsersService: GroupUsersService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
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

  @Put('users/:user_id')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateGroupUsers(
    @Req() req: any,
    @Body()
    args: UpdateMerchantGroupUsersValidation,
    @Param('gid') groupId: string,
    @Param('user_id') groupUserId: string,
  ): Promise<RSuccessMessage> {
    args.group_id = groupId;
    args.id = groupUserId;

    // await this.groupUsersService.isCanModifDataValidation(
    //   req.user,
    //   args.group_id,
    // );

    const result = await this.groupUsersService.updateGroupUsers(
      args,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Delete('users/:user_id')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteGroupUsers(
    @Req() req: any,
    @Param('user_id') user_id: string,
  ): Promise<RSuccessMessage> {
    await this.groupUsersService.deleteGroupUsers(user_id, req.user);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
    );
  }

  @Get('users')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listGroupUsers(
    @Req() req: any,
    @Query() listGroupUserDTO: ListGroupUserDTO,
  ): Promise<RSuccessMessage> {
    const listGroupUsers = await this.groupUsersService.listGroupUsers(
      listGroupUserDTO,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      listGroupUsers,
    );
  }

  @Get('users/:user_id')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async detailGroupUsers(
    @Req() req: any,
    @Param('user_id') user_id: string,
  ): Promise<RSuccessMessage> {
    const detailGroupUser = await this.groupUsersService.detailGroupUser(
      user_id,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      detailGroupUser,
    );
  }

  @Put('users/:user_id/phone')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePhoneGroupUsers(
    @Req() req: any,
    @Body()
    args: UpdatePhoneGroupUsersValidation,
    @Param('user_id') groupUserId: string,
  ): Promise<RSuccessMessage> {
    const result = await this.groupUsersService.updatePhoneGroupUsers(
      groupUserId,
      args,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Put('users/:user_id/email')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateEmailGroupUsers(
    @Req() req: any,
    @Body()
    args: UpdateEmailGroupUsersValidation,
    @Param('user_id') groupUserId: string,
  ): Promise<any> {
    const result = await this.groupUsersService.updateEmailGroupUsers(
      groupUserId,
      args,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Put('users/:user_id/password')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePasswordGroupUsers(
    @Req() req: any,
    @Param('user_id') groupUserId: string,
  ): Promise<any> {
    const result = await this.groupUsersService.updatePasswordGroupUsers(
      groupUserId,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Post('users/:uid/email/resend')
  @UserTypeAndLevel('admin.*', 'merchant.group')
  @AuthJwtGuard()
  async resendEmailUser(@Param('uid') user_id: string) {
    return this.groupUsersService.resendEmailUser(user_id);
  }

  @Post('users/:uid/phone/resend')
  @UserTypeAndLevel('admin.*', 'merchant.group')
  @AuthJwtGuard()
  async resendPhoneUser(@Param('uid') user_id: string) {
    return this.groupUsersService.resendPhoneUser(user_id);
  }
}
