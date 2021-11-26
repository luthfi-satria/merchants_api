import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import * as bodyParser from 'body-parser';
import { CustomStrategy } from '@nestjs/microservices';
import { NatsTransportStrategy } from '@alexy4744/nestjs-nats-jetstream-transporter';

const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(bodyParser.json({ limit: '50mb' }));
  // app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.map((err) => {
            const { value, property, constraints } = err;
            return {
              value,
              property,
              constraint: Object.keys(constraints).map((key) => {
                return {
                  code: `VALIDATION_${key.toUpperCase()}`,
                  message: constraints[key],
                };
              }),
            };
          }),
        );
      },
    }),
  );

  const microservice = app.connectMicroservice<CustomStrategy>({
    strategy: new NatsTransportStrategy({
      connection: {
        servers: process.env.NATS_SERVERS.split(','),
      },
      streams: [
        {
          name: 'merchants',
          subjects: ['merchants.store.*'],
        },
      ],
      consumer: (opt) => {
        // durable
        opt.durable('merchants');

        // queue group
        opt.queue('merchants');
      },
    }),
  });

  microservice.listen();

  app.listen(process.env.HTTP_PORT || 4002, () => {
    logger.log(`Running on ${process.env.HTTP_PORT || 4002}`);
  });
}
bootstrap();
