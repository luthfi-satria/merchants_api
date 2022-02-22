import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { IAddons } from 'src/database/interfaces/addons.interface';
import { Repository } from 'typeorm';
import { addons } from './addons.data';

@Injectable()
export class AddonSeedersServices {
  constructor(
    @InjectRepository(AddonDocument)
    private readonly addonRepository: Repository<AddonDocument>,
  ) {}
  create(): Array<Promise<AddonDocument>> {
    return addons.map(async (addon: IAddons) => {
      return this.addonRepository
        .findOne({ id: addon.id })
        .then(async (findOne) => {
          if (findOne) {
            return Promise.resolve(null);
          }
          const create_addons = this.addonRepository.create(addon);
          return this.addonRepository.save(create_addons);
        })
        .catch((error) => Promise.reject(error));
    });
  }
}
