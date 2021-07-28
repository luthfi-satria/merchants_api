import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LobDocument } from 'src/database/entities/lob.entity';
import { LobController } from './lob.controller';
import { LobService } from './lob.service';

@Module({
  imports: [TypeOrmModule.forFeature([LobDocument]), HttpModule],
  controllers: [LobController],
  providers: [LobService],
})
export class LobModule {}
