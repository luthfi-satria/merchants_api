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
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MerchantUsersService } from './merchants_users.service';
import {
  CreateMerchantUsersValidation,
  UpdateMerchantUsersValidation,
} from './validation/merchants_users.validation';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { ListMerchantUsersValidation } from './validation/list_merchants_users.validation';
import { RSuccessMessage } from 'src/response/response.interface';
import { MerchantUsersUpdatePhoneValidation } from './validation/merchants_users_update_phone.validation';
import { MerchantUsersUpdateEmailValidation } from './validation/merchants_users_update_email.validation';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MerchantsService } from './merchants.service';
import { GroupsService } from 'src/groups/groups.service';
import { StoresService } from 'src/stores/stores.service';

@Controller('api/v1/merchants/merchants')
export class MerchantUsersController {
  constructor(
    private readonly merchantUsersService: MerchantUsersService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly merchantService: MerchantsService,
    private readonly groupService: GroupsService,
    private readonly storeService: StoresService,
  ) {}

  @Post('users')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createMerchantUsers(
    @Req() req: any,
    @Body()
    merchantUserValidation: CreateMerchantUsersValidation,
  ): Promise<RSuccessMessage> {
    const result = await this.merchantUsersService.createMerchantUsers(
      merchantUserValidation,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Put('users/:uid')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsers(
    @Req() req: any,
    @Body()
    args: UpdateMerchantUsersValidation,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    // args.id = merchantUserId;
    const resultUpdate = await this.merchantUsersService.updateMerchantUsers(
      args,
      req.user,
      merchantUserId,
    );

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      resultUpdate,
    );
  }

  @Put('users/:uid/password')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsersPassword(
    @Req() req: any,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    // param.id = merchantUserId;
    const resultUpdate =
      await this.merchantUsersService.updatePasswordMerchantUsers(
        merchantUserId,
        req.user,
      );

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      resultUpdate,
    );
  }

  @Put('users/:uid/phone')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsersPhone(
    @Req() req: any,
    @Body()
    param: MerchantUsersUpdatePhoneValidation,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    param.id = merchantUserId;
    const resultUpdate =
      await this.merchantUsersService.updatePhoneMerchantUsers(param, req.user);

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      resultUpdate,
    );
  }

  @Put('users/:uid/email')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsersEmail(
    @Req() req: any,
    @Body()
    param: MerchantUsersUpdateEmailValidation,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    param.id = merchantUserId;
    const resultUpdate =
      await this.merchantUsersService.updateEmailMerchantUsers(param, req.user);

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      resultUpdate,
    );
  }

  @Delete('users/:user_id')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteMerchantUsers(
    @Req() req: any,
    @Param('user_id') user_id: string,
  ): Promise<any> {
    const deleteUser = await this.merchantUsersService.deleteMerchantUsers(
      user_id,
      req.user,
    );
    if (!deleteUser) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user_id,
            property: 'id',
            constraint: [this.messageService.get('merchant_user.delete.fail')],
          },
          'Bad Request',
        ),
      );
    }
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
  async listMerchantUsers(
    @Req() req: any,
    @Query() param: ListMerchantUsersValidation,
  ): Promise<any> {
    const list_merchant = await this.merchantUsersService.listMerchantUsers(
      param,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      list_merchant,
    );
  }

  @Get('users/:user_id')
  @UserType('admin')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async detailMerchantUsers(
    @Req() req: any,
    @Param('user_id') user_id: string,
  ): Promise<any> {
    const user = await this.merchantUsersService.detailMerchantUsers(
      user_id,
      req.user,
    );

    if (user.merchant) {
      await this.merchantService.manipulateMerchantUrl(user.merchant);
      if (user.merchant.group)
        await this.groupService.manipulateGroupUrl(user.merchant.group);
    }

    if (user.stores && user.stores.length > 0) {
      for (const store of user.stores) {
        await this.storeService.manipulateStoreUrl(store);
      }
    }

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      user,
    );
  }

  @Post('users/:uid/email/resend')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  async resendEmailUser(@Param('uid') user_id: string) {
    return this.merchantUsersService.resendEmailUser(user_id);
  }

  @Post('users/:uid/phone/resend')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  async resendPhoneUser(@Param('uid') user_id: string) {
    return this.merchantUsersService.resendPhoneUser(user_id);
  }
}
