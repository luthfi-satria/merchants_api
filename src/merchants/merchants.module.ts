import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MerchantDocument]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService],
})
export class MerchantsModule {}
