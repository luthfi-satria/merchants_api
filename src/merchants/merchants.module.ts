import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BanksService } from 'src/banks/banks.service';
import { GroupDocument } from 'src/database/entities/group.entity';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { GroupsService } from 'src/groups/groups.service';
import { LobService } from 'src/lob/lob.service';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantDocument,
      GroupDocument,
      LobDocument,
      ListBankDocument,
    ]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService, GroupsService, LobService, BanksService],
})
export class MerchantsModule {}
