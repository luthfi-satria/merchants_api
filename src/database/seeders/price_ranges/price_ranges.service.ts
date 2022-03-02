import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceRangeDocument } from 'src/database/entities/price_range.entity';
import { IPriceRanges } from 'src/database/interfaces/price_ranges.interface';
import { Repository } from 'typeorm';
import { priceRanges } from './price_ranges.data';

@Injectable()
export class PriceRangeSeedersServices {
  constructor(
    @InjectRepository(PriceRangeDocument)
    private readonly priceRangeRepository: Repository<PriceRangeDocument>,
  ) {}
  create(): Array<Promise<PriceRangeDocument>> {
    return priceRanges.map(async (priceRange: IPriceRanges) => {
      return this.priceRangeRepository
        .findOne({ id: priceRange.id })
        .then(async (findOne) => {
          if (findOne) {
            return Promise.resolve(null);
          }
          const create_priceranges =
            this.priceRangeRepository.create(priceRange);
          return this.priceRangeRepository.save(create_priceranges);
        })
        .catch((error) => Promise.reject(error));
    });
  }
}
