import { Controller, Post, Body } from '@nestjs/common';
import { UsersValidationService } from './users_validation.service';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { CreateUserDto } from './dto/user-validation.dto';

@Controller('api/v1/merchants/user-validation')
export class UsersValidationController {
  constructor(
    private readonly usersValidationService: UsersValidationService,
  ) {}
  @Post('validate')
  @UserTypeAndLevel('merchant.*')
  @AuthJwtGuard()
  async validateUser(@Body() body: CreateUserDto): Promise<any> {
    return this.usersValidationService.validateUser(body.id, body.password);
  }
}
