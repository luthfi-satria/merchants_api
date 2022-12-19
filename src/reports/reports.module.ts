import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { StoreDocument } from 'src/database/entities/store.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { SearchHistoryKeywordDocument } from 'src/database/entities/search_history_keyword.entity';
import { SearchHistoryStoreDocument } from 'src/database/entities/search_history_store.entity';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { HttpModule } from '@nestjs/axios';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { StoresService } from 'src/stores/stores.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { AddonsService } from 'src/addons/addons.service';
import { HashService } from 'src/hash/hash.service';
import { LoginService } from 'src/login/login.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreUsersService } from 'src/stores/stores_users.service';
import { CommonService } from 'src/common/common.service';
import { CityService } from 'src/common/services/admins/city.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { GroupsService } from 'src/groups/groups.service';
import { LobService } from 'src/lob/lob.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { InternalService } from 'src/internal/internal.service';
import { NatsService } from 'src/nats/nats.service';
import { QueryService } from 'src/query/query.service';
import { PriceRangeService } from 'src/price_range/price_range.service';
import { SettingsService } from 'src/settings/settings.service';
import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { UsersService } from 'src/users/users.service';
import { NewMerchantEntity } from './repositories/new-merchants.repository';

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
      MenuOnlineDocument,
    ]),
    HttpModule,
    MerchantsModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
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
    NatsService,
    QueryService,
    PriceRangeService,
    SettingsService,
    StoreCategoriesService,
    MenuOnlineService,
    UsersService,
    NewMerchantEntity,
  ],
})
export class ReportsModule {}
