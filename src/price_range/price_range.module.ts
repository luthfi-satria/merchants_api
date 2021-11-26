import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeController } from './price_range.controller';
import { PriceRangeService } from './price_range.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceRangeDocument, PriceRangeLanguageDocument]),
  ],
  controllers: [PriceRangeController],
  providers: [PriceRangeService, MessageService, ResponseService],
  exports: [PriceRangeService],
})
export class PriceRangeModule {}
