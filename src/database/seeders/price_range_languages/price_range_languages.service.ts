import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceRangeLanguageDocument } from 'src/database/entities/price_range_language.entity';
import { IPriceRangeLanguages } from 'src/database/interfaces/price_range_languages.interface';
import { Repository } from 'typeorm';
import { priceRangeLanguages } from './price_range_languages.data';

@Injectable()
export class PriceRangeLanguageSeedersServices {
  constructor(
    @InjectRepository(PriceRangeLanguageDocument)
    private readonly priceRangeLanguageRepository: Repository<PriceRangeLanguageDocument>,
  ) {}
  create(): Array<Promise<PriceRangeLanguageDocument>> {
    return priceRangeLanguages.map(
      async (priceRangeLanguage: IPriceRangeLanguages) => {
        return this.priceRangeLanguageRepository
          .findOne({ id: priceRangeLanguage.id })
          .then(async (findOne) => {
            if (findOne) {
              return Promise.resolve(null);
            }
            const create_priceRangeLanguage =
              this.priceRangeLanguageRepository.create(priceRangeLanguage);
            return this.priceRangeLanguageRepository.save(
              create_priceRangeLanguage,
            );
          })
          .catch((error) => Promise.reject(error));
      },
    );
  }
}
