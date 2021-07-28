import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { AddonsController } from './addons.controller';
import { AddonsService } from './addons.service';

@Module({
  imports: [TypeOrmModule.forFeature([AddonDocument]), HttpModule],
  controllers: [AddonsController],
  providers: [AddonsService],
})
export class AddonsModule {}
