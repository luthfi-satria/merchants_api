import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { HashService } from 'src/hash/hash.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantUsersDocument]), HttpModule],
  exports: [ProfileService],
  controllers: [ProfileController],
  providers: [ProfileService, HashService],
})
export class ProfileModule {}
