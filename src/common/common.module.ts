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
import { NatsController } from './nats/nats.controller';
import { MenuEfoodService } from 'src/menu_efood/menu_efood.service';
import { MenuEfoodDocument } from 'src/database/entities/menu_efood.entity';
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
      MenuEfoodDocument,
      MerchantUsersDocument,
      StoreCategoriesDocument,
      AddonDocument,
      MerchantDocument,
      StoreOperationalHoursDocument,
      StoreOperationalShiftDocument,
      GroupDocument,
      LobDocument,
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
    MenuEfoodService,
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
  ],
  exports: [
    CommonStorageService,
    CityService,
    RoleService,
    NotificationService,
    CommonStoresService,
    CatalogsService,
  ],
  controllers: [NatsController],
})
export class CommonModule {}
