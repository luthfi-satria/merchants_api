import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreDocument])],
  exports: [BannersService],
  controllers: [BannersController],
  providers: [BannersService, MessageService, ResponseService],
})
export class BannersModule {}
