import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonsService } from 'src/addons/addons.service';
import { CommonService } from 'src/common/common.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { HashService } from 'src/hash/hash.service';
import { LobService } from 'src/lob/lob.service';
import { LoginService } from 'src/login/login.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoresService } from 'src/stores/stores.service';
import { UsersService } from 'src/users/users.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { GroupsService } from '../groups/groups.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { NatsService } from 'src/nats/nats.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { RegistersController } from './register.controller';
import { RegistersService } from './register.service';
import { GroupUsersService } from 'src/groups/group_users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupDocument,
      MerchantDocument,
      MerchantUsersDocument,
      StoreDocument,
      StoreCategoriesDocument,
      LobDocument,
      AddonDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      MenuOnlineDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [RegistersController],
  providers: [
    GroupsService,
    RegistersService,
    GroupUsersService,
    GroupsService,
    MerchantsService,
    HashService,
    MessageService,
    ResponseService,
    LoginService,
    ImageValidationService,
    CommonService,
    CommonStorageService,
    MerchantUsersService,
    LobService,
    StoresService,
    AddonsService,
    StoreOperationalService,
    UsersService,
    NatsService,
    MenuOnlineService,
  ],
})
export class RegistersModule {}
