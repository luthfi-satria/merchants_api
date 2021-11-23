import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantUsersDocument])],
  controllers: [UsersController],
  providers: [UsersService, MessageService, ResponseService],
})
export class UsersModule {}
