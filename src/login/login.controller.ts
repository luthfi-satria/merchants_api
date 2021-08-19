import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { GroupsService } from 'src/groups/groups.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { LoginEmailValidation } from './validation/login.email.validation';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { LoginPhoneValidation } from './validation/login.phone.validation';
import { LoginService } from './login.service';
import { OtpValidateValidation } from './validation/otp.validate.validation';
import { OtpEmailValidateValidation } from './validation/otp.email-validate.validation';
import { catchError, map } from 'rxjs';

@Controller('api/v1/merchants')
export class LoginController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly loginService: LoginService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('login/email')
  @ResponseStatusCode()
  async loginByEmail(
    @Body()
    data: LoginEmailValidation,
  ): Promise<any> {
    return await this.loginService.loginEmailProcess(data);
  }

  @Post('login/phone')
  @ResponseStatusCode()
  async loginByPhone(
    @Body(RequestValidationPipe(LoginPhoneValidation))
    data: LoginPhoneValidation,
  ): Promise<any> {
    data.access_type = 'phone';
    return await this.loginService.loginPhoneProcess(data);
  }

  @Post('login/phone-otp-validation')
  @ResponseStatusCode()
  async validatePhoneOtpValidation(
    @Body()
    data: OtpValidateValidation,
  ): Promise<any> {
    return await this.loginService.loginPhoneOtpValidationProcess(data);
  }

  @Post('login/email-otp-validation')
  @ResponseStatusCode()
  async validateEmailOtpValidation(
    @Body()
    data: OtpEmailValidateValidation,
  ): Promise<any> {
    return await this.loginService.loginEmailOtpValidationProcess(data);
  }

  @Post('login/refresh-token')
  async refreshToken(@Headers('Authorization') token: string): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/refresh-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
      'request-from': 'merchant',
    };
    const http_req: Record<string, any> = {
      user_type: 'merchant',
      roles: ['merchant'],
    };

    return (
      await this.loginService.postHttp(url, http_req, headersRequest)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }
}
