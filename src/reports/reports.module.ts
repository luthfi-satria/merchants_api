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
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { HttpModule } from '@nestjs/axios';
import { StoresService } from 'src/stores/stores.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { AddonsService } from 'src/addons/addons.service';
import { HashService } from 'src/hash/hash.service';
import { LoginService } from 'src/login/login.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { CommonService } from 'src/common/common.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { GroupsService } from 'src/groups/groups.service';
import { LobService } from 'src/lob/lob.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { NatsService } from 'src/nats/nats.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { UsersService } from 'src/users/users.service';
import { ResetPasswordService } from 'src/merchants/reset-password.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { MulterModule } from '@nestjs/platform-express';
import { GroupsModule } from 'src/groups/groups.module';
import { ProfileModule } from 'src/merchants/profile/profile.module';
import { NewMerchantEntity } from './repository/new-merchants.repository';
import { NewMerchantEntity as NewMerchantRepository } from './repositories/new-merchants.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantDocument,
      GroupDocument,
      LobDocument,
      MerchantUsersDocument,
      StoreCategoriesDocument,
      StoreDocument,
      AddonDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      MenuOnlineDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
    GroupsModule,
    ProfileModule,
  ],
  controllers: [ReportsController],
  providers: [
    MerchantsService,
    GroupsService,
    LobService,
    HashService,
    LoginService,
    ImageValidationService,
    MerchantUsersService,
    GroupUsersService,
    CommonService,
    ResetPasswordService,
    NotificationService,
    MessageService,
    ResponseService,
    StoresService,
    AddonsService,
    StoreOperationalService,
    UsersService,
    NatsService,
    MenuOnlineService,
    ReportsService,
    NewMerchantEntity,
    NewMerchantRepository,
  ],
})
export class ReportsModule {}
