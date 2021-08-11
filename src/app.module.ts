import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantsModule } from './merchants/merchants.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database/database.service';
import { MessageModule } from './message/message.module';
import { ResponseModule } from './response/response.module';
import { StoresModule } from './stores/stores.module';
import { GroupsModule } from './groups/groups.module';
import { LobModule } from './lob/lob.module';
import { BanksModule } from './banks/banks.module';
import { AddonsModule } from './addons/addons.module';
import { LoginModule } from './login/login.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    MerchantsModule,
    MessageModule,
    ResponseModule,
    HttpModule,
    StoresModule,
    GroupsModule,
    StoresModule,
    LobModule,
    BanksModule,
    AddonsModule,
    LoginModule,
    QueryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
