import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { CatalogsService } from 'src/common/catalogs/catalogs.service';
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
import { LoginService } from 'src/login/login.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { PriceRangeModule } from 'src/price_range/price_range.module';
import { SettingModule } from 'src/settings/setting.module';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoresService } from 'src/stores/stores.service';
import { UsersService } from 'src/users/users.service';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { NatsService } from 'src/nats/nats.service';
import { OrdersService } from 'src/common/orders/orders.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { StoreCategoriesService } from 'src/store_categories/store_categories.service';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueryElasticService } from './query-elastic.service';

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
      SearchHistoryStoreDocument,
      SearchHistoryKeywordDocument,
      MenuOnlineDocument,
      LanguageDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    PriceRangeModule,
    SettingModule,
    HttpModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME'),
          password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
        headers: {
          Authorization:
            'basic ' +
            btoa(
              unescape(
                encodeURIComponent(
                  configService.get('ELASTICSEARCH_USERNAME') +
                    ':' +
                    configService.get('ELASTICSEARCH_PASSWORD'),
                ),
              ),
            ),
        },
      }),
      inject: [ConfigService],
    }),
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
    MessageService,
    ResponseService,
    GroupsService,
    LobService,
    GroupUsersService,
    CatalogsService,
    UsersService,
    NatsService,
    OrdersService,
    MenuOnlineService,
    StoreCategoriesService,
    QueryElasticService,
  ],
})
export class QueryModule {}
