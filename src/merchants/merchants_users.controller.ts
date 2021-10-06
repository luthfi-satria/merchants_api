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

import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MerchantUsersService } from './merchants_users.service';
import { MerchantUsersValidation } from './validation/merchants_users.validation';
import { HttpService } from '@nestjs/axios';
import { Message } from 'src/message/message.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { ListMerchantUsersValidation } from './validation/list_merchants_users.validation';
import { RSuccessMessage } from 'src/response/response.interface';
import { MerchantUsersUpdatePasswordValidation } from './validation/merchants_users_update_password.validation';
import { MerchantUsersUpdatePhoneValidation } from './validation/merchants_users_update_phone.validation';
import { MerchantUsersUpdateEmailValidation } from './validation/merchants_users_update_email.validation';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { MerchantUsersStatus } from 'src/database/entities/merchant_users.entity';

@Controller('api/v1/merchants/merchants')
export class MerchantUsersController {
  constructor(
    private readonly merchantUsersService: MerchantUsersService,
    private readonly httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('users')
  @UserType('admin')
  @UserTypeAndLevel('merchnat.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createMerchantUsers(
    @Req() req: any,
    @Body()
    merchantUserValidation: MerchantUsersValidation,
  ): Promise<RSuccessMessage> {
    if (req.user.level == 'merchant') {
      merchantUserValidation.status = MerchantUsersStatus.Waiting_for_approval;
    }
    const result = await this.merchantUsersService.createMerchantUsers(
      merchantUserValidation,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Put('users/:uid')
  @UserType('admin')
  @UserTypeAndLevel('merchnat.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantUsersValidation>,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    // user level group hanya bisa mengubah status
    if (req.user.leve == 'group') {
      for (const key in args) {
        if (key != 'status') {
          delete args[key];
        }
      }
    }
    args.id = merchantUserId;
    const resultUpdate = await this.merchantUsersService.updateMerchantUsers(
      args,
      req.user,
    );

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      resultUpdate,
    );
  }

  @Put('users/:uid/password')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsersPassword(
    @Req() req: any,
    @Body()
    param: MerchantUsersUpdatePasswordValidation,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    param.id = merchantUserId;
    const resultUpdate = await this.merchantUsersService.updateMerchantUsers(
      param,
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
  @UserTypeAndLevel('merchnat.group')
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
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      user,
    );
  }
}
