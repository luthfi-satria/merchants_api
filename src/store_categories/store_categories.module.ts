import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageDocument } from 'src/database/entities/language.entity';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { HashService } from 'src/hash/hash.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { StoreCategoriesService } from './store_categories.service';
import { StoreCategoriesController } from './strore_categories.controller';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreCategoriesDocument, LanguageDocument]),
    MulterModule.register({
      limits: { fileSize: 2 * 1000 * 1000 },
    }),
    HttpModule,
  ],
  controllers: [StoreCategoriesController],
  providers: [
    StoreCategoriesService,
    ImageValidationService,
    HashService,
    MessageService,
    ResponseService,
  ],
  exports: [],
})
export class StoreCategoriesModule {}
