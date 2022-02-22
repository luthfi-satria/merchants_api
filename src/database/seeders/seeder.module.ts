import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonDocument } from '../entities/addons.entity';
import { SettingDocument } from '../entities/setting.entity';
import { AddonSeedersServices } from './addons/addons.service';
import { Seeder } from './seeder';
import { SettingsSeederModule } from './settings/settings.module';
import { SettingsSeederService } from './settings/settings.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([SettingDocument, AddonDocument]),
    SettingsSeederModule,
  ],
  providers: [Logger, Seeder, SettingsSeederService, AddonSeedersServices],
})
export class SeederModule {}
