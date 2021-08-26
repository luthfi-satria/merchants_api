import { HttpModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { HashService } from 'src/hash/hash.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreCategoriesService } from './store_categories.service';
import { StoreCategoriesController } from './strore_categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreCategoriesDocument]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [StoreCategoriesController],
  providers: [StoreCategoriesService, ImageValidationService, HashService],
  exports: [],
})
export class StoreCategoriesModule {}
