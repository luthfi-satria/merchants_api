import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { PriceRangeLanguageSeedersServices } from './price_range_languages.service';

/**
 * Import and provide seeder classes for countrys.
 *
 * @module
 */
@Module({
  imports: [TypeOrmModule.forFeature([PriceRangeLanguageDocument])],
  providers: [PriceRangeLanguageSeedersServices],
  exports: [PriceRangeLanguageSeedersServices],
})
export class PriceRangeLanguageSeedersModules {}
