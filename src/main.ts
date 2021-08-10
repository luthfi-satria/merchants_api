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

  app.listen(process.env.HTTP_PORT || 4002, () => {
    logger.log(`Running on ${process.env.HTTP_PORT || 4002}`);
  });
}
bootstrap();
