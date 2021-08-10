import { Body, Controller, Post } from '@nestjs/common';
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
}
