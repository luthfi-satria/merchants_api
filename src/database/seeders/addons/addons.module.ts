import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { AddonSeedersServices } from './addons.service';

/**
 * Import and provide seeder classes for countrys.
 *
 * @module
 */
@Module({
  imports: [TypeOrmModule.forFeature([AddonDocument])],
  providers: [AddonSeedersServices],
  exports: [AddonSeedersServices],
})
export class AddonSeedersModules {}
