import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BanksModule } from './banks/banks.module';
import { Seeder } from './banks/seeder';

async function bootstrap() {
  NestFactory.createApplicationContext(BanksModule)
    .then((appContext) => {
      const logger = new Logger(); // appContext.get(Logger);
      const seeder = appContext.get(Seeder);
      seeder
        .seed()
        .then(() => {
          logger.debug('Seeding complete!');
        })
        .catch((error) => {
          logger.error('Seeding failed!');
          throw error;
        })
        .finally(() => appContext.close());
    })
    .catch((error) => {
      throw error;
    });
}
bootstrap();
