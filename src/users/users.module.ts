import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantUsersDocument])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
