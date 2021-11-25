import { MenuEfoodDocument } from 'src/database/entities/menu_efood.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuEfoodService } from './menu_efood.service';
import { MenuEfoodController } from './menu_efood.controller';
import { StoresService } from 'src/stores/stores.service';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { AddonsService } from 'src/addons/addons.service';
import { HttpModule } from '@nestjs/axios';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { CommonService } from 'src/common/common.service';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuEfoodDocument,
      StoreDocument,
      MerchantUsersDocument,
      StoreCategoriesDocument,
      AddonDocument,
      MerchantDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      GroupDocument,
      LobDocument,
    ]),
    ConfigModule.forRoot(),
    HttpModule,
  ],
  controllers: [MenuEfoodController],
  providers: [
    MenuEfoodService,
    StoresService,
    MessageService,
    ResponseService,
    AddonsService,
    MerchantsService,
    StoreOperationalService,
    CommonService,
    GroupsService,
    UsersService,
    HashService,
    MerchantUsersService,
    LobService,
    GroupUsersService,
  ],
})
export class MenuEfoodModule {}
