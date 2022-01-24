import { Global, Module } from '@nestjs/common';
import { NatsController } from './nats.controller';
import { NatsService } from './nats.service';

@Global()
@Module({ providers: [NatsService], controllers: [NatsController] })
export class NatsModule {}
