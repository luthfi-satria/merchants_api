import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BanksService } from 'src/banks/banks.service';
import { CommonService } from 'src/common/common.service';
import { GroupDocument } from 'src/database/entities/group.entity';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { GroupsModule } from 'src/groups/groups.module';
import { GroupsService } from 'src/groups/groups.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { HashService } from 'src/hash/hash.service';
import { LobService } from 'src/lob/lob.service';
import { LoginService } from 'src/login/login.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { MerchantUsersController } from './merchants_users.controller';
import { MerchantUsersService } from './merchants_users.service';
import { ResetPasswordController } from './reset-password.controller';
import { ResetPasswordService } from './reset-password.service';
import { ProfileModule } from './profile/profile.module';
import { NotificationService } from 'src/common/notification/notification.service';
import { StoresService } from 'src/stores/stores.service';
import { AddonsService } from 'src/addons/addons.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { UsersService } from 'src/users/users.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { StoreOperationalShiftDocument } from 'src/database/entities/store_operational_shift.entity';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantDocument,
      GroupDocument,
      LobDocument,
      ListBankDocument,
      MerchantUsersDocument,
      StoreDocument,
      StoreCategoriesDocument,
      AddonDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
    GroupsModule,
    ProfileModule,
  ],
  controllers: [
    MerchantUsersController,
    MerchantsController,
    ResetPasswordController,
  ],
  providers: [
    MerchantsService,
    GroupsService,
    LobService,
    BanksService,
    HashService,
    LoginService,
    ImageValidationService,
    MerchantUsersService,
    GroupUsersService,
    CommonService,
    ResetPasswordService,
    NotificationService,
    StoresService,
    AddonsService,
    StoreOperationalService,
    UsersService,
  ],
})
export class MerchantsModule {}
