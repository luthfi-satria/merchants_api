import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Module({
  imports: [TypeOrmModule.forFeature([SettingDocument])],
  controllers: [SettingsController],
  providers: [SettingsService, MessageService, ResponseService],
  exports: [SettingsService],
})
export class SettingModule {}
