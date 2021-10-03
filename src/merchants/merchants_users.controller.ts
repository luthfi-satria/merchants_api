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
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createMerchantUsers(
    @Body()
    merchantUserValidation: MerchantUsersValidation,
  ): Promise<RSuccessMessage> {
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
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateMerchantUsers(
    @Req() req: any,
    @Body()
    args: Partial<MerchantUsersValidation>,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    args.id = merchantUserId;
    const resultUpdate = await this.merchantUsersService.updateMerchantUsers(
      args,
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
    @Body()
    param: MerchantUsersUpdatePasswordValidation,
    @Param('uid') merchantUserId: string,
  ): Promise<any> {
    param.id = merchantUserId;
    const resultUpdate = await this.merchantUsersService.updateMerchantUsers(
      param,
    );

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
  async deleteMerchantUsers(@Param('user_id') user_id: string): Promise<any> {
    const deleteUser = await this.merchantUsersService.deleteMerchantUsers(
      user_id,
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
