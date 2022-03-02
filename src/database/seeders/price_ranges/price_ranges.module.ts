import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceRangeSeedersServices } from './price_ranges.service';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';

/**
 * Import and provide seeder classes for countrys.
 *
 * @module
 */
@Module({
  imports: [TypeOrmModule.forFeature([PriceRangeDocument])],
  providers: [PriceRangeSeedersServices],
  exports: [PriceRangeSeedersServices],
})
export class PriceRangeSeedersModules {}
