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
import { MerchantUsersService } from './merchants_users.service';
import { MerchantUsersValidation } from './validation/merchants_users.validation';
import { HttpService } from '@nestjs/axios';
import { Message } from 'src/message/message.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { ListMerchantUsersValidation } from './validation/list_merchants_users.validation';

@Controller('api/v1/merchants/merchants')
export class MerchantUsersController {
  constructor(
    private readonly merchantUsersService: MerchantUsersService,
    private readonly httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
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

  @Delete('users/:user_id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deleteMerchantUsers(@Param('user_id') user_id: string): Promise<any> {
    const result = await this.merchantUsersService.deleteMerchantUsers(user_id);
    console.log(
    '===========================Start Debug result=================================\n',
    new Date(Date.now()).toLocaleString(),
    '\n',
    result,
    '\n============================End Debug result==================================',
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
    );
  }

  @Get('users')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listMerchantUsers(
    @Query() param: ListMerchantUsersValidation,
  ): Promise<any> {
    const list_merchant = await this.merchantUsersService.listMerchantUsers(
      param,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      list_merchant,
    );
  }
}
