import { NatsClient } from '@alexy4744/nestjs-nats-jetstream-transporter';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NatsService {
  protected readonly client = new NatsClient({
    connection: {
      servers: process.env.NATS_SERVERS.split(','),
    },
  });

  constructor(private readonly httpService: HttpService) {}

  logger = new Logger();

  async clientEmit(eventName: string, payload: any): Promise<void> {
    this.logger.log(eventName, 'Publish Event');
    this.client.emit(eventName, payload);
  }
}
