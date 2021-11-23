import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { AddonsController } from './addons.controller';
import { AddonsService } from './addons.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';

@Module({
  imports: [TypeOrmModule.forFeature([AddonDocument]), HttpModule],
  controllers: [AddonsController],
  providers: [AddonsService, ResponseService, MessageService],
})
export class AddonsModule {}
