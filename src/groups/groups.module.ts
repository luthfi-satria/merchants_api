import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { HashService } from 'src/hash/hash.service';
import { LobService } from 'src/lob/lob.service';
import { LoginService } from 'src/login/login.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupUsersController } from './group_users.controller';
import { GroupUsersService } from './group_users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupDocument,
      MerchantDocument,
      MerchantUsersDocument,
      StoreDocument,
      LobDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [GroupsController, GroupUsersController],
  providers: [
    GroupsService,
    MerchantsService,
    HashService,
    LoginService,
    ImageValidationService,
    GroupUsersService,
    CommonService,
    CommonStorageService,
    MerchantUsersService,
    LobService,
  ],
})
export class GroupsModule {}
