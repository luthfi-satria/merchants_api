import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonService } from './common.service';
import { CityService } from './services/admins/city.service';
import { RoleService } from './services/admins/role.service';
import { CommonStorageService } from './storage/storage.service';
import { NotificationService } from './notification/notification.service';
import { CommonStoresService } from './own/stores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { CatalogsService } from './catalogs/catalogs.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CommonNatsController } from './nats/nats.controller';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { StoresService } from 'src/stores/stores.service';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { AddonsService } from 'src/addons/addons.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { GroupsService } from 'src/groups/groups.service';
import { UsersService } from 'src/users/users.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { HashService } from 'src/hash/hash.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { LobService } from 'src/lob/lob.service';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { GroupUsersService } from 'src/groups/group_users.service';
import { LobDocument } from 'src/database/entities/lob.entity';
import { NatsService } from 'src/nats/nats.service';
import { OrdersService } from './orders/orders.service';
import { InternalService } from 'src/internal/internal.service';
import { LoginService } from 'src/login/login.service';
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

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    HttpModule,
    TypeOrmModule.forFeature([
      StoreDocument,
      MenuOnlineDocument,
      MerchantUsersDocument,
      StoreCategoriesDocument,
      AddonDocument,
      MerchantDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      GroupDocument,
      LobDocument,
      SearchHistoryKeywordDocument,
      SearchHistoryStoreDocument,
      PriceRangeDocument,
      PriceRangeLanguageDocument,
      SettingDocument,
      LanguageDocument,
    ]),
  ],
  providers: [
    CommonStorageService,
    CommonService,
    CityService,
    ResponseService,
    MessageService,
    RoleService,
    NotificationService,
    CommonStoresService,
    CatalogsService,
    MenuOnlineService,
    StoresService,
    AddonsService,
    MerchantsService,
    StoreOperationalService,
    GroupsService,
    UsersService,
    HashService,
    MerchantUsersService,
    LobService,
    GroupUsersService,
    NatsService,
    OrdersService,
    InternalService,
    LoginService,
    QueryService,
    PriceRangeService,
    SettingsService,
    StoreCategoriesService,
  ],
  exports: [
    CommonStorageService,
    CityService,
    RoleService,
    NotificationService,
    CommonStoresService,
    CatalogsService,
    OrdersService,
  ],
  controllers: [CommonNatsController],
})
export class CommonModule {}
