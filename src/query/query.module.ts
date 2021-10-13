import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { CommonService } from 'src/common/common.service';
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
import { LobService } from 'src/lob/lob.service';
import { LoginService } from 'src/login/login.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { PriceRangeModule } from 'src/price_range/price_range.module';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoresService } from 'src/stores/stores.service';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

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
    PriceRangeModule,
    HttpModule,
  ],
  controllers: [QueryController],
  providers: [
    QueryService,
    StoresService,
    StoreOperationalService,
    MerchantsService,
    AddonsService,
    MerchantsService,
    HashService,
    LoginService,
    CommonService,
    MerchantUsersService,
    GroupsService,
    LobService,
    GroupUsersService,
  ],
})
export class QueryModule {}
