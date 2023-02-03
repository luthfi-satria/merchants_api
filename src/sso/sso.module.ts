import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SsoService } from './sso.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SsoController } from './sso.controller';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([MerchantUsersDocument, SettingDocument]),
    ScheduleModule.forRoot(),
    ConfigModule,
    HttpModule,
  ],
  controllers: [SsoController],
  providers: [SsoService, MessageService, ResponseService],
})
export class SsoModule {}
