import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.map((err) => {
            const { value, property, constraints } = err;
            return { value, property, constraints: Object.values(constraints) };
          }),
        );
      },
    }),
  );

  app.listen(process.env.PORT || 4002, () => {
    logger.log(`Running on ${process.env.PORT || 4002}`);
  });
}
bootstrap();
