import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
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
import { MerchantsModule } from 'src/merchants/merchants.module';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
// import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreOperationalController } from './stores-operational.controller';
import { StoreOperationalService } from './stores-operational.service';
import { StoresService } from './stores.service';
import { StoreUsersController } from './stores_users.controller';
import { StoreUsersService } from './stores_users.service';
import { StoresController } from './strores.controller';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { NatsService } from 'src/nats/nats.service';
import { QueryService } from 'src/query/query.service';
import { PriceRangeService } from 'src/price_range/price_range.service';
import { SettingsService } from 'src/settings/settings.service';
import { SearchHistoryKeywordDocument } from 'src/database/entities/search_history_keyword.entity';
import { SearchHistoryStoreDocument } from 'src/database/entities/search_history_store.entity';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { LanguageDocument } from 'src/database/entities/language.entity';

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
      SearchHistoryKeywordDocument,
      SearchHistoryStoreDocument,
      PriceRangeDocument,
      PriceRangeLanguageDocument,
      SettingDocument,
      LanguageDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
    UsersModule,
    MerchantsModule,
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
    HashService,
    LoginService,
    ImageValidationService,
    StoreUsersService,
    CommonService,
    CityService,
    MerchantUsersService,
    MessageService,
    ResponseService,
    GroupsService,
    LobService,
    GroupUsersService,
    InternalService,
    UsersService,
    NatsService,
    QueryService,
    PriceRangeService,
    SettingsService,
    StoreCategoriesService,
  ],
  exports: [StoresService, StoreOperationalService],
})
export class StoresModule {}
