import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { Global, HttpModule, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CityService } from './services/admins/city.service';
import { CommonStorageService } from './storage/storage.service';
import { MailerService } from './mailer/mailer.service';

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
  ],
  providers: [CommonStorageService, CommonService, CityService, MailerService],
  exports: [CommonStorageService, CityService],
})
export class CommonModule {}
