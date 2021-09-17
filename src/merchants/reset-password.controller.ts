import { Body, Controller, Post, Query } from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResetPasswordService } from './reset-password.service';
import { MerchantUsersValidation } from './validation/merchants_users.validation';

@Controller('api/v1/merchants/reset-password')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Post('email')
  @ResponseStatusCode()
  async resetPassEmail(
    @Body()
    args: Partial<MerchantUsersValidation>,
  ): Promise<any> {
    return await this.resetPasswordService.resetPasswordEmail(args);
  }

  @Post('phone')
  @ResponseStatusCode()
  async resetPassPhone(
    @Body()
    args: Partial<MerchantUsersValidation>,
  ): Promise<any> {
    return await this.resetPasswordService.resetPasswordPhone(args);
  }

  @Post('password')
  @ResponseStatusCode()
  async resetPassPassword(
    @Body()
    args: Partial<MerchantUsersValidation>,
    @Query() qstring: Record<string, any>,
  ): Promise<any> {
    return await this.resetPasswordService.resetPasswordExec(args, qstring);
  }
}
