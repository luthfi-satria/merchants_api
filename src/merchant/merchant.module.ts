import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupDocument } from 'src/database/entities/group.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupDocument, MerchantDocument, StoreDocument]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
  ],
  controllers: [MerchantController],
  providers: [MerchantService],
})
export class MerchantModule {}
