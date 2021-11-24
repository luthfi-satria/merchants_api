import { MenuEfoodService } from './menu_efood.service';
import { MenuEfoodController } from './menu_efood.controller';
import { MenuEfoodDocument } from 'src/database/entities/menu_efood.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuEfoodDocument]),
    ConfigModule.forRoot(),
  ],
  controllers: [MenuEfoodController],
  providers: [MenuEfoodService],
})
export class MenuEfoodModule {}
