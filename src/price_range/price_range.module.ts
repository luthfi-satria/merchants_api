import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeController } from './price_range.controller';
import { PriceRangeService } from './price_range.service';

@Module({
  imports: [TypeOrmModule.forFeature([PriceRangeDocument])],
  controllers: [PriceRangeController],
  providers: [PriceRangeService],
  exports: [PriceRangeService],
})
export class PriceRangeModule {}
