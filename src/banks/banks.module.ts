import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoresModule } from 'src/stores/stores.module';
import { BanksStoresController } from './banks-store.controller';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { CommonService } from 'src/common/common.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ListBankDocument, StoreDocument]),
    ConfigModule.forRoot(),
    HttpModule,
    StoresModule,
  ],
  controllers: [BanksController, BanksStoresController],
  providers: [BanksService, ResponseService, MessageService, CommonService],
})
export class BanksModule {}
