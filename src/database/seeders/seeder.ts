import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AddonSeedersServices } from './addons/addons.service';
import { SettingsSeederService } from './settings/settings.service';

@Injectable()
export class Seeder implements OnApplicationBootstrap {
  constructor(
    private readonly logger: Logger,
    private readonly settingsSeederServices: SettingsSeederService,
    private readonly addonSeedersServices: AddonSeedersServices,
  ) {}
  onApplicationBootstrap() {
    this.seed();
  }
  async seed() {
    await this.addons()
      .then((completed) => {
        this.logger.debug('Successfuly completed seeding Addons...');
        Promise.resolve(completed);
      })
      .catch((error) => {
        this.logger.error('Failed seeding Addons...');
        Promise.reject(error);
      });

    await this.settings();
    this.logger.debug('Successfuly completed seeding Settings...');
  }

  async addons() {
    return Promise.all(this.addonSeedersServices.create())
      .then((createdAddons) => {
        this.logger.debug(
          'No. of Addons created : ' +
            createdAddons.filter(
              (nullValueOrCreatedAddons) => nullValueOrCreatedAddons,
            ).length,
        );
        return Promise.resolve(true);
      })
      .catch((error) => Promise.reject(error));
  }

  async settings() {
    return this.settingsSeederServices.create();
  }
}
