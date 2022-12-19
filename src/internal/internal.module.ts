import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { CommonService } from 'src/common/common.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { SearchHistoryKeywordDocument } from 'src/database/entities/search_history_keyword.entity';
import { SearchHistoryStoreDocument } from 'src/database/entities/search_history_store.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { GroupsService } from 'src/groups/groups.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { HashService } from 'src/hash/hash.service';
import { LobService } from 'src/lob/lob.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoresService } from 'src/stores/stores.service';
import { UsersService } from 'src/users/users.service';
import { AuthInternalService } from './auth-internal.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { NatsService } from 'src/nats/nats.service';
import { LoginService } from 'src/login/login.service';
import { QueryService } from 'src/query/query.service';
import { PriceRangeService } from 'src/price_range/price_range.service';
import { SettingsService } from 'src/settings/settings.service';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import {CorporateSapKeyDocument} from "../database/entities/corporate_sap_keys.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreDocument,
      MerchantUsersDocument,
      AddonDocument,
      MerchantDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      StoreCategoriesDocument,
      GroupDocument,
      LobDocument,
      SearchHistoryStoreDocument,
      SearchHistoryKeywordDocument,
      PriceRangeDocument,
      PriceRangeLanguageDocument,
      SettingDocument,
      LanguageDocument,
      MenuOnlineDocument,
      CorporateSapKeyDocument,
    ]),
    HttpModule,
  ],
  controllers: [InternalController],
  providers: [
    InternalService,
    StoresService,
    AddonsService,
    MerchantsService,
    HashService,
    StoreOperationalService,
    CommonService,
    MerchantUsersService,
    GroupsService,
    LobService,
    GroupUsersService,
    AuthInternalService,
    UsersService,
    MessageService,
    ResponseService,
    NatsService,
    LoginService,
    QueryService,
    PriceRangeService,
    SettingsService,
    StoreCategoriesService,
    MenuOnlineService,
  ],
  exports: [AuthInternalService],
})
export class InternalModule {}
