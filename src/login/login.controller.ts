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
} from '@nestjs/common';
import { GroupsService } from 'src/groups/groups.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { LoginEmailValidation } from './validation/login.email.validation';
import { LoginPhoneValidation } from './validation/login.phone.validation';
import { LoginService } from './login.service';
import { catchError, map } from 'rxjs';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { RMessage } from 'src/response/response.interface';
import { UbahPasswordValidation } from './validation/ubah-password.validation';
import { UpdateProfileValidation } from './validation/update-profile.validation';
import { AuthInternalService } from 'src/internal/auth-internal.service';
import { MerchantProfileResponse } from './types';

@Controller('api/v1/merchants')
export class LoginController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly loginService: LoginService,
    private readonly authInternalService: AuthInternalService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  // @Post('login/email')
  // @ResponseStatusCode()
  // async loginByEmail(
  //   @Body()
  //   data: LoginEmailValidation,
  // ): Promise<any> {
  //   return await this.loginService.loginEmailProcess(data);
  // }

  // @Post('login/phone')
  // @ResponseStatusCode()
  // async loginByPhone(
  //   @Body(RequestValidationPipe(LoginPhoneValidation))
  //   data: LoginPhoneValidation,
  // ): Promise<any> {
  //   data.access_type = 'phone';
  //   return await this.loginService.loginPhoneProcess(data);
  // }

  // @Post('login/phone-otp-validation')
  // @ResponseStatusCode()
  // async validatePhoneOtpValidation(
  //   @Body()
  //   data: OtpValidateValidation,
  // ): Promise<any> {
  //   return await this.loginService.loginPhoneOtpValidationProcess(data);
  // }

  // @Post('login/email-otp-validation')
  // @ResponseStatusCode()
  // async validateEmailOtpValidation(
  //   @Body()
  //   data: OtpEmailValidateValidation,
  // ): Promise<any> {
  //   return await this.loginService.loginEmailOtpValidationProcess(data);
  // }

  @Post('login/refresh-token')
  async refreshToken(@Headers('Authorization') token: string): Promise<any> {
    return this.loginService.refreshToken(token);
  }

  @Get('profile')
  @UserType('merchant')
  @AuthJwtGuard()
  async profile(@Req() req: any) {
    const profile = await this.loginService.getProfile(req.user.id);
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
    delete profile.password;

    const user_role = await this.authInternalService.getMerchantUserRoleDetail(
      profile.role_id,
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
    return await this.loginService.ubahPasswordProcess(data, req.user);
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
    return await this.loginService.updateProfile(data, req.user);
  }
}
