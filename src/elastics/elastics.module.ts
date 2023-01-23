import { Module } from '@nestjs/common';
import { ElasticsService } from './elastics.service';
import { ElasticsController } from './elastics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ElasticsearchModule } from '@nestjs/elasticsearch/dist';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AddonDocument,
      GroupDocument,
      LanguageDocument,
      LobDocument,
      MenuOnlineDocument,
      MerchantUsersDocument,
      MerchantDocument,
      PriceRangeDocument,
      PriceRangeLanguageDocument,
      SettingDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      StoreCategoriesDocument,
      StoreDocument,
    ]),
    ScheduleModule.forRoot(),
    ConfigModule,
    HttpModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_AUTH'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ElasticsController],
  providers: [ElasticsService, MessageService, ResponseService],
})
export class ElasticsModule {}
