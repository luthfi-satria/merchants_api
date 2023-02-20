import { Controller, Get, Post } from '@nestjs/common';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { SsoService } from './sso.service';

@Controller('api/v1/merchants/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post('authenticate')
  @ResponseStatusCode()
  async ssoAuthentication() {
    return this.ssoService.ssoAuthentication();
  }

  @Get('updated_users')
  @ResponseStatusCode()
  async getUpdatedUsers() {
    return this.ssoService.getUpdatedUsers();
  }
}
