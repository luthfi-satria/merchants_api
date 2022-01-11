import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SettingsSeederService } from './settings/settings.service';

@Injectable()
export class Seeder implements OnApplicationBootstrap {
  constructor(
    private readonly logger: Logger,
    private readonly settingsSeederServices: SettingsSeederService,
  ) {}
  onApplicationBootstrap() {
    this.seed();
  }
  async seed() {
    await this.settings();
    this.logger.debug('Successfuly completed seeding Settings...');
  }
  async settings() {
    return this.settingsSeederServices.create();
  }
}
