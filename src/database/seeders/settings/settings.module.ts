import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { SettingsSeederService } from './settings.service';

/**
 * Import and provide seeder classes for countrys.
 *
 * @module
 */
@Module({
  imports: [TypeOrmModule.forFeature([SettingDocument])],
  providers: [SettingsSeederService],
  exports: [SettingsSeederService],
})
export class SettingsSeederModule {}
