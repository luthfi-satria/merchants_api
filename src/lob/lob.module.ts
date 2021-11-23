import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LobDocument } from 'src/database/entities/lob.entity';
import { LobController } from './lob.controller';
import { LobService } from './lob.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Module({
  imports: [TypeOrmModule.forFeature([LobDocument]), HttpModule],
  controllers: [LobController],
  providers: [LobService, ResponseService, MessageService],
})
export class LobModule {}
