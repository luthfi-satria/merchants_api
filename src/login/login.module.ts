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
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { GroupsService } from 'src/groups/groups.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { HashService } from 'src/hash/hash.service';
import { InternalModule } from 'src/internal/internal.module';
import { LobService } from 'src/lob/lob.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoresService } from 'src/stores/stores.service';
import { UsersService } from 'src/users/users.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { NatsService } from 'src/nats/nats.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantUsersDocument,
      GroupDocument,
      MerchantDocument,
      StoreDocument,
      LobDocument,
      StoreCategoriesDocument,
      AddonDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      MenuOnlineDocument,
    ]),
    HttpModule,
    InternalModule,
  ],
  controllers: [LoginController],
  providers: [
    LoginService,
    HashService,
    GroupsService,
    MerchantsService,
    GroupUsersService,
    CommonService,
    MerchantUsersService,
    LobService,
    MessageService,
    ResponseService,
    StoresService,
    AddonsService,
    StoreOperationalService,
    UsersService,
    NatsService,
    MenuOnlineService,
  ],
})
export class LoginModule {}
