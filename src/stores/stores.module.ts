import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { CommonService } from 'src/common/common.service';
import { CityService } from 'src/common/services/admins/city.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { GroupsService } from 'src/groups/groups.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { HashService } from 'src/hash/hash.service';
import { InternalService } from 'src/internal/internal.service';
import { LobService } from 'src/lob/lob.service';
import { LoginService } from 'src/login/login.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
// import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreOperationalController } from './stores-operational.controller';
import { StoreOperationalService } from './stores-operational.service';
import { StoresService } from './stores.service';
import { StoreUsersController } from './stores_users.controller';
import { StoreUsersService } from './stores_users.service';
import { StoresController } from './strores.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      MerchantDocument,
      AddonDocument,
      MerchantDocument,
      MerchantUsersDocument,
      StoreCategoriesDocument,
      GroupDocument,
      LobDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [
    StoresController,
    StoreOperationalController,
    StoreUsersController,
  ],
  providers: [
    StoresService,
    StoreOperationalService,
    MerchantsService,
    AddonsService,
    MerchantsService,
    HashService,
    LoginService,
    ImageValidationService,
    StoreUsersService,
    CommonService,
    CityService,
    MerchantUsersService,
    GroupsService,
    LobService,
    GroupUsersService,
    InternalService,
  ],
  exports: [StoresService, StoreOperationalService],
})
export class StoresModule {}
