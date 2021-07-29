import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoresService } from './stores.service';
import { StoresController } from './strores.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreDocument, MerchantDocument]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [StoresController],
  providers: [StoresService, MerchantsService],
})
export class StoresModule {}
