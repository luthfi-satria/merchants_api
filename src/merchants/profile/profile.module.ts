import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { HashService } from 'src/hash/hash.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonService } from 'src/common/common.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantUsersDocument]), HttpModule],
  exports: [ProfileService],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    HashService,
    MessageService,
    ResponseService,
    CommonService,
  ],
})
export class ProfileModule {}
