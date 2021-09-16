import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { GroupsService } from 'src/groups/groups.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { HashService } from 'src/hash/hash.service';
import { LobService } from 'src/lob/lob.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantUsersDocument,
      GroupDocument,
      MerchantDocument,
      StoreDocument,
      LobDocument,
    ]),
    HttpModule,
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
  ],
})
export class LoginModule {}
