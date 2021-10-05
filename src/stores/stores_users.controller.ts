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
  BadRequestException,
  ConflictException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { StoreUsersService } from './stores_users.service';
import { MerchantStoreUsersValidation } from './validation/store_users.validation';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { UpdateMerchantStoreUsersValidation } from './validation/update_store_users.validation';
import { ListMerchantStoreUsersValidation } from './validation/list_store_users.validation';
import { firstValueFrom, map, catchError, EMPTY } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ResponseService } from 'src/response/response.service';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { UpdatePhoneStoreUsersValidation } from './validation/update_phone_store_users.validation';
import { UpdateEmailStoreUsersValidation } from './validation/update_email_store_users.validation';

@Controller('api/v1/merchants/stores')
export class StoreUsersController {
  constructor(
    private readonly storeUsersService: StoreUsersService,
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

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
    const result = await this.storeUsersService.updateStoreUsers(
      args,
      req.user,
    );
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Put('users/:uid/phone')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePhoneStoreUsers(
    @Req() req: any,
    @Body()
    args: UpdatePhoneStoreUsersValidation,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    return this.storeUsersService.updatePhoneStoreUsers(
      storeUserId,
      args,
      req.user,
    );
  }

  @Put('users/:uid/email')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateEmailStoreUsers(
    @Req() req: any,
    @Body()
    args: UpdateEmailStoreUsersValidation,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    return this.storeUsersService.updateEmailStoreUsers(
      storeUserId,
      args,
      req.user,
    );
  }

  @Put('users/:uid/password')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePasswordStoreUsers(
    @Req() req: any,
    @Param('uid') storeUserId: string,
  ): Promise<any> {
    return this.storeUsersService.updatePasswordStoreUsers(
      storeUserId,
      req.user,
    );
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
    @Query() query: ListMerchantStoreUsersValidation,
  ): Promise<any> {
    const result = await this.storeUsersService.listStoreUsers(query, req.user);

    // niel TODO: tidy up this
    const { items } = result.data;
    const payload = items.map((e) => {
      return e.role_id;
    });
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/roles/batchs`;
    const res = await firstValueFrom(
      this.httpService.post(url, payload, { headers: headerRequest }).pipe(
        map((resp) => {
          const { data } = resp?.data;

          return data;
        }),
        catchError((err: any) => {
          Logger.error(err.message, '', 'AdminsRoles Create Module');

          const { status, data } = err.response;
          const { error, message } = data; // statusCode, message, error
          const { constraint, value, property } = message[0];

          if (status == HttpStatus.BAD_REQUEST) {
            throw new BadRequestException(
              this.responseService.error(HttpStatus.BAD_REQUEST, {
                constraint: constraint,
                property: property,
                value: value,
              }),
              `ERROR Create Module Permission`,
            );
          } else if (status == HttpStatus.CONFLICT) {
            throw new ConflictException(
              this.responseService.error(HttpStatus.CONFLICT, {
                constraint: constraint,
                property: property,
                value: value,
              }),
              `ERROR ${error}`,
            );
          } else if (status == HttpStatus.NOT_FOUND) {
            throw new NotFoundException(
              this.responseService.error(HttpStatus.NOT_FOUND, {
                constraint: constraint,
                property: property,
                value: value,
              }),
              `ERROR ${error}`,
            );
          }
          return EMPTY;
        }),
      ),
    );

    //parse into new map
    const parsedData = this.storeUsersService.parseRoleDetails(items, res);
    const listResponse: ListResponse = {
      current_page: result.data.current_page,
      limit: result.data.limit,
      total_item: result.data.total_item,
      items: parsedData,
    };

    return listResponse;
  }

  @Get('users/:store_user_id')
  @UserTypeAndLevel('admin.*', 'merchant.group', 'merchant.merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async detailStoreUsers(
    @Req() req: any,
    @Param('store_user_id') storeUserId: string,
  ): Promise<any> {
    const store_user = await this.storeUsersService.detailStoreUsers(
      storeUserId,
      req.user,
    );
    if (!store_user) {
      const errors: RMessage = {
        value: storeUserId,
        property: 'store_user_id',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      store_user,
    );
  }
}
