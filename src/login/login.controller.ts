import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpStatus,
  Post,
  Put,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { GroupsService } from 'src/groups/groups.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import {
  LoginEmailValidation,
  VerifyLoginDto,
} from './validation/login.email.validation';
import { LoginPhoneValidation } from './validation/login.phone.validation';
import { LoginService } from './login.service';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { UbahPasswordValidation } from './validation/ubah-password.validation';
import { UpdateProfileValidation } from './validation/update-profile.validation';
import { AuthInternalService } from 'src/internal/auth-internal.service';
import { MerchantProfileResponse } from './types';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoresService } from 'src/stores/stores.service';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';

@Controller('api/v1/merchants')
export class LoginController {
  constructor(
    private readonly groupService: GroupsService,
    private readonly merchantService: MerchantsService,
    private readonly merchantUserService: MerchantUsersService,
    private readonly storeService: StoresService,
    private readonly loginService: LoginService,
    private readonly authInternalService: AuthInternalService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Post('login/refresh-token')
  @UserType('merchant')
  @AuthJwtGuard()
  async refreshToken(
    @Headers('Authorization') token: string,
    @Req() req: any,
  ): Promise<any> {
    const profile = await this.merchantUserService.findById(req.user.id);
    if (profile.status != MerchantUsersStatus.Active) {
      const errors: RMessage = {
        value: profile.status,
        property: 'status',
        constraint: [this.messageService.get('auth.login.unactivedUser')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorized',
        ),
      );
    }

    return this.loginService.refreshToken(token, profile);
  }

  @Get('profile')
  @UserType('merchant')
  @AuthJwtGuard()
  async profile(@Req() req: any) {
    const profile = await this.loginService.getProfile(req.user);
    if (!profile) {
      const errors: RMessage = {
        value: '',
        property: 'payload',
        constraint: [
          this.messageService.get('merchant.login.unregistered_user'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    await this.manipulateMerchantUserUrl(profile);

    const user_role = await this.authInternalService.getMerchantUserRoleDetail(
      req.user.role_id,
    );
    // parse to new Response with additional attribute
    const result = new MerchantProfileResponse({
      ...profile,
      role: user_role,
    });

    return this.responseService.success(
      true,
      this.messageService.get('merchant.login.success'),
      result,
    );
  }

  @Post('login')
  @ResponseStatusCode()
  async loginByEmailPassword(
    @Body()
    data: LoginEmailValidation,
    @Query() queryData: Partial<LoginEmailValidation>,
  ): Promise<any> {
    data.lang = queryData.lang ? queryData.lang : 'id';
    return this.loginService.loginEmailPasswordProcess(data);
  }

  @Post('login/phone-password')
  @ResponseStatusCode()
  async loginByPhonePassword(
    @Body()
    data: LoginPhoneValidation,
    @Query() queryData: Partial<LoginPhoneValidation>,
  ): Promise<any> {
    data.lang = queryData.lang ? queryData.lang : 'id';
    return this.loginService.loginPhonePasswordProcess(data);
  }

  @Put('profile/password')
  @UserType('merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async ubahPassword(
    @Req() req: any,
    @Body()
    data: UbahPasswordValidation,
  ): Promise<any> {
    return this.loginService.ubahPasswordProcess(data, req.user);
  }

  @Put('profile')
  @UserType('merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateProfile(
    @Req() req: any,
    @Body()
    data: UpdateProfileValidation,
  ): Promise<any> {
    const result = await this.loginService.updateProfile(data, req.user);

    await this.manipulateMerchantUserUrl(result);

    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  @Post('login/verify')
  @ResponseStatusCode()
  async verifyLogin(
    @Body()
    data: VerifyLoginDto,
  ): Promise<RSuccessMessage> {
    try {
      const result = await this.loginService.verifyLogin(data);

      await this.manipulateMerchantUserUrl(result);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async manipulateMerchantUserUrl(
    result: MerchantUsersDocument,
  ): Promise<MerchantUsersDocument> {
    delete result.password;

    if (result.merchant) {
      await this.merchantService.manipulateMerchantUrl(result.merchant);
      if (result.merchant.group)
        await this.groupService.manipulateGroupUrl(result.merchant.group);
      delete result.merchant.pic_password;
    }
    if (result.group) {
      delete result.group.director_password;
      delete result.group.pic_operational_password;
      delete result.group.pic_finance_password;
      await this.groupService.manipulateGroupUrl(result.group);
    }
    if (result.store) {
      await this.storeService.manipulateStoreUrl(result.store);
      if (result.store.merchant) {
        await this.merchantService.manipulateMerchantUrl(result.store.merchant);
        if (result.store.merchant.group)
          await this.groupService.manipulateGroupUrl(
            result.store.merchant.group,
          );
      }
    }

    return result;
  }
}
