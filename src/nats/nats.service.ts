import { NatsClient } from '@alexy4744/nestjs-nats-jetstream-transporter';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NatsService {
  protected readonly client = new NatsClient({
    connection: {
      servers: process.env.NATS_SERVERS.split(','),
    },
  });

  logger = new Logger();

  async clientEmit(eventName: string, payload: any): Promise<void> {
    this.logger.log(eventName, 'Publish Event');
    this.client.emit(eventName, payload);
  }
}
