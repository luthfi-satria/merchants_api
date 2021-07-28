import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from 'src/database/database.service';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { ListBankSeederService } from './listbankseeders.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    TypeOrmModule.forFeature([ListBankDocument]),
    ConfigModule.forRoot(),
  ],
  controllers: [BanksController],
  providers: [
    BanksService,
    ListBankSeederService,
    MessageService,
    ResponseService,
  ],
  exports: [ListBankSeederService],
})
export class BanksModule {}
