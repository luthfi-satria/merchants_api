import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantsModule } from './merchants/merchants.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database/database.service';
import { StoresModule } from './stores/stores.module';
import { GroupsModule } from './groups/groups.module';
import { LobModule } from './lob/lob.module';
import { BanksModule } from './banks/banks.module';
import { AddonsModule } from './addons/addons.module';
import { LoginModule } from './login/login.module';
import { QueryModule } from './query/query.module';
import { CommonModule } from './common/common.module';
import { InternalModule } from './internal/internal.module';
import { AuthModule } from './auth/auth.module';
import { StoreCategoriesModule } from './store_categories/store_categories.module';
import { PriceRangeModule } from './price_range/price_range.module';
import { BannersModule } from './banners/banners.module';
import { SettingModule } from './settings/setting.module';
import { UsersModule } from './users/users.module';
import { MenuOnlineModule } from './menu_online/menu_online.module';
import { SeederModule } from './database/seeders/seeder.module';
import { NatsModule } from './nats/nats.module';
import { LoginMultilevelModule } from './login-multilevel/login-multilevel.module';
import { RegistersModule } from './register/register.module';
import { ResponseService } from './response/response.service';
import { ValidationMiddleware } from './middleware/validation.middleware';
import { UsersValidationModule } from './users_validation/users_validation.module';
import { ResponseService } from './response/response.service';
import { ValidationMiddleware } from './middleware/validation.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    MerchantsModule,
    HttpModule,
    StoresModule,
    GroupsModule,
    StoresModule,
    LobModule,
    BanksModule,
    AddonsModule,
    LoginModule,
    QueryModule,
    CommonModule,
    InternalModule,
    AuthModule,
    StoreCategoriesModule,
    PriceRangeModule,
    BannersModule,
    SettingModule,
    UsersModule,
    MenuOnlineModule,
    SeederModule,
    NatsModule,
    LoginMultilevelModule,
    RegistersModule,
    UsersValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService, ResponseService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ValidationMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
