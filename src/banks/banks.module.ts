import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { StoreDocument } from 'src/database/entities/store.entity';
import { StoresModule } from 'src/stores/stores.module';
import { BanksStoresController } from './banks-store.controller';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ListBankDocument, StoreDocument]),
    ConfigModule.forRoot(),
    StoresModule,
  ],
  controllers: [BanksController, BanksStoresController],
  providers: [BanksService],
})
export class BanksModule {}
