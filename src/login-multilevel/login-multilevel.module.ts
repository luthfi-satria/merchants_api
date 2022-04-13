import { Module } from '@nestjs/common';
import { LoginMultilevelService } from './login-multilevel.service';
import { LoginMultilevelController } from './login-multilevel.controller';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { HttpModule } from '@nestjs/axios';
import { HashService } from 'src/hash/hash.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { GroupsService } from 'src/groups/groups.service';
import { StoresService } from 'src/stores/stores.service';
import { CommonService } from 'src/common/common.service';
import { LobService } from 'src/lob/lob.service';
import { NatsService } from 'src/nats/nats.service';
import { GroupDocument } from 'src/database/entities/group.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { GroupUsersService } from 'src/groups/group_users.service';
import { AddonsService } from 'src/addons/addons.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { UsersService } from 'src/users/users.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { LobDocument } from 'src/database/entities/lob.entity';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantUsersDocument,
      MerchantDocument,
      GroupDocument,
      StoreDocument,
      StoreCategoriesDocument,
      LobDocument,
      AddonDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      MenuOnlineDocument,
    ]),
    HttpModule,
  ],
  providers: [
    LoginMultilevelService,
    MerchantUsersService,
    ResponseService,
    MessageService,
    HashService,
    MerchantsService,
    GroupsService,
    StoresService,
    CommonService,
    LobService,
    NatsService,
    GroupUsersService,
    AddonsService,
    StoreOperationalService,
    UsersService,
    MenuOnlineService,
  ],
  controllers: [LoginMultilevelController],
  exports: [LoginMultilevelService],
})
export class LoginMultilevelModule {}
