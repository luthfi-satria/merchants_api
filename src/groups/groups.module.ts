import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupDocument } from 'src/database/entities/group.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupDocument, MerchantDocument]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, MerchantsService],
})
export class GroupsModule {}
