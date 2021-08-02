import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { HashService } from 'src/hash/hash.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoresService } from './stores.service';
import { StoresController } from './strores.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreDocument,
      MerchantDocument,
      AddonDocument,
      MerchantDocument,
      MerchantUsersDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [StoresController],
  providers: [
    StoresService,
    MerchantsService,
    AddonsService,
    MerchantsService,
    HashService,
  ],
})
export class StoresModule {}
