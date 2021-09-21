import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreDocument])],
  exports: [BannersService],
  controllers: [BannersController],
  providers: [BannersService]
})
export class BannersModule { }
