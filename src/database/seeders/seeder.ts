import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AddonSeedersServices } from './addons/addons.service';
import { PriceRangeSeedersServices } from './price_ranges/price_ranges.service';
import { PriceRangeLanguageSeedersServices } from './price_range_languages/price_range_languages.service';
import { SettingsSeederService } from './settings/settings.service';

@Injectable()
export class Seeder implements OnApplicationBootstrap {
  constructor(
    private readonly logger: Logger,
    private readonly settingsSeederServices: SettingsSeederService,
    private readonly addonSeedersServices: AddonSeedersServices,
    private readonly priceRangeSeedersServices: PriceRangeSeedersServices,
    private readonly priceRangeLanguageSeedersService: PriceRangeLanguageSeedersServices,
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

    await this.priceRanges()
      .then((completed) => {
        this.logger.debug('Successfuly completed seeding Price Range...');
        Promise.resolve(completed);
      })
      .catch((error) => {
        this.logger.error('Failed seeding Price Range...');
        Promise.reject(error);
      });

    await this.priceRangeLanguages()
      .then((completed) => {
        this.logger.debug(
          'Successfuly completed seeding Price Range Language...',
        );
        Promise.resolve(completed);
      })
      .catch((error) => {
        this.logger.error('Failed seeding Price Range Language...');
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

  async priceRanges() {
    return Promise.all(this.priceRangeSeedersServices.create())
      .then((createdPriceRanges) => {
        this.logger.debug(
          'No. of Price Range created : ' +
            createdPriceRanges.filter(
              (nullValueOrCreatedPriceRanges) => nullValueOrCreatedPriceRanges,
            ).length,
        );
        return Promise.resolve(true);
      })
      .catch((error) => Promise.reject(error));
  }

  async priceRangeLanguages() {
    return Promise.all(this.priceRangeLanguageSeedersService.create())
      .then((createdPriceRangeLanguages) => {
        this.logger.debug(
          'No. of Price Range Language created : ' +
            createdPriceRangeLanguages.filter(
              (nullValueOrCreatedPriceRangeLanguages) =>
                nullValueOrCreatedPriceRangeLanguages,
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
