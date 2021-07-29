import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ListBankDocument]),
    ConfigModule.forRoot(),
  ],
  controllers: [BanksController],
  providers: [BanksService],
})
export class BanksModule {}
