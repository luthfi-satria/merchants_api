import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { StoresService } from 'src/stores/stores.service';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { AddonsService } from 'src/addons/addons.service';
import { HttpModule } from '@nestjs/axios';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { CommonService } from 'src/common/common.service';
import { GroupsService } from 'src/groups/groups.service';
import { UsersService } from 'src/users/users.service';
import { NatsService } from 'src/nats/nats.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { HashService } from 'src/hash/hash.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { LobService } from 'src/lob/lob.service';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { GroupUsersService } from 'src/groups/group_users.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { LobDocument } from 'src/database/entities/lob.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreDocument,
      MerchantUsersDocument,
      StoreCategoriesDocument,
      AddonDocument,
      MerchantDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      GroupDocument,
      MenuOnlineDocument,
      LobDocument,
    ]),
    HttpModule,
  ],
  exports: [BannersService],
  controllers: [BannersController],
  providers: [
    BannersService,
    MessageService,
    ResponseService,
    StoresService,
    AddonsService,
    MerchantsService,
    StoreOperationalService,
    CommonService,
    NatsService,
    GroupsService,
    UsersService,
    MenuOnlineService,
    HashService,
    MerchantUsersService,
    LobService,
    GroupUsersService,
  ],
})
export class BannersModule {}
