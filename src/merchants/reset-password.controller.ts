import { Body, Controller, Post, Query } from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResetPasswordService } from './reset-password.service';
import { MerchantMerchantValidation } from './validation/merchants.validation';

@Controller('api/v1/merchants/reset-password')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Post('email')
  @ResponseStatusCode()
  async resetPassEmail(
    @Body()
    args: Partial<MerchantMerchantValidation>,
  ): Promise<any> {
    return await this.resetPasswordService.resetPasswordEmail(args);
  }

  @Post('password')
  @ResponseStatusCode()
  async resetPassPassword(
    @Body()
    args: Partial<MerchantMerchantValidation>,
    @Query() qstring: Record<string, any>,
  ): Promise<any> {
    return await this.resetPasswordService.resetPasswordExec(args, qstring);
  }
}
