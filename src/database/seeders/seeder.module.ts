import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonDocument } from '../entities/addons.entity';
import { PriceRangeDocument } from '../entities/price_range.entity';
import { PriceRangeLanguageDocument } from '../entities/price_range_language.entity';
import { SettingDocument } from '../entities/setting.entity';
import { AddonSeedersServices } from './addons/addons.service';
import { PriceRangeSeedersServices } from './price_ranges/price_ranges.service';
import { PriceRangeLanguageSeedersServices } from './price_range_languages/price_range_languages.service';
import { Seeder } from './seeder';
import { SettingsSeederModule } from './settings/settings.module';
import { SettingsSeederService } from './settings/settings.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      SettingDocument,
      AddonDocument,
      PriceRangeDocument,
      PriceRangeLanguageDocument,
    ]),
    SettingsSeederModule,
  ],
  providers: [
    Logger,
    Seeder,
    SettingsSeederService,
    AddonSeedersServices,
    PriceRangeSeedersServices,
    PriceRangeLanguageSeedersServices,
  ],
})
export class SeederModule {}
