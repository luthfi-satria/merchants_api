import { Module } from '@nestjs/common';
import { UsersValidationService } from './users_validation.service';
import { UsersValidationController } from './users_validation.controller';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { HashService } from 'src/hash/hash.service';
// module user validation
@Module({
  imports: [TypeOrmModule.forFeature([MerchantUsersDocument])],
  controllers: [UsersValidationController],
  providers: [
    UsersValidationService,
    MessageService,
    ResponseService,
    HashService,
  ],
})
export class UsersValidationModule {}
