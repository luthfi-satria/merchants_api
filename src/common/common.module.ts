import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { Global, HttpModule, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CityService } from './services/admins/city.service';
import { RoleService } from './services/admins/role.service';
import { CommonStorageService } from './storage/storage.service';
import { NotificationService } from './notification/notification.service';
import { CommonStoresService } from './own/stores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { CatalogsService } from './catalogs/catalogs.service';

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    HttpModule,
    TypeOrmModule.forFeature([StoreDocument]),
  ],
  providers: [
    CommonStorageService,
    CommonService,
    CityService,
    RoleService,
    NotificationService,
    CommonStoresService,
    CatalogsService,
  ],
  exports: [
    CommonStorageService,
    CityService,
    RoleService,
    NotificationService,
    CommonStoresService,
    CatalogsService,
  ],
})
export class CommonModule {}
