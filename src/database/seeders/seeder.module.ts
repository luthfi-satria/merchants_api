import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingDocument } from '../entities/setting.entity';
import { Seeder } from './seeder';
import { SettingsSeederModule } from './settings/settings.module';
import { SettingsSeederService } from './settings/settings.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([SettingDocument]),
    SettingsSeederModule,
  ],
  providers: [Logger, Seeder, SettingsSeederService],
})
export class SeederModule {}
