import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';

@Global()
@Module({
  providers: [
    {
      provide: 'MessageService',
      useClass: MessageService,
    },
    HashService,
  ],
  exports: [MessageService],
  imports: [ConfigModule.forRoot()],
})
export class MessageModule {}
