import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { LoginMultilevelService } from './login-multilevel.service';
import { ChangeLevelDto } from './validation/login_multilevel.validation';

@Controller('api/v1/merchants/login-multilevel')
export class LoginMultilevelController {
  constructor(
    private readonly loginMultilevelService: LoginMultilevelService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Get('brand-store')
  @UserType('merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async listBrandStore(@Req() req: any) {
    const result = await this.loginMultilevelService.getListBrandStore(
      req.user,
    );

    return this.responseService.success(
      true,
      this.messageService.get('merchant.login.success'),
      result,
    );
  }

  @Post('change-level')
  @UserType('merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async changeLevel(
    @Req() req: any,
    @Body()
    data: ChangeLevelDto,
  ) {
    return this.loginMultilevelService.changeLevel(data, req.user);
  }

  @Post('original-level')
  @UserType('merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async originalLevel(@Req() req: any) {
    return this.loginMultilevelService.originalLevel(req.user);
  }
}
