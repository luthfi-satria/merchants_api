import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { HashService } from 'src/hash/hash.service';
import { LoginService } from 'src/login/login.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreOperationalController } from './stores-operational.controller';
import { StoreOperationalService } from './stores-operational.service';
import { StoresService } from './stores.service';
import { StoresController } from './strores.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreDocument,
      StoreOperationalHoursDocument,
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
  controllers: [StoresController, StoreOperationalController],
  providers: [
    StoresService,
    StoreOperationalService,
    MerchantsService,
    AddonsService,
    MerchantsService,
    HashService,
    LoginService,
    ImageValidationService,
  ],
  exports: [StoresService, StoreOperationalService],
})
export class StoresModule {}
