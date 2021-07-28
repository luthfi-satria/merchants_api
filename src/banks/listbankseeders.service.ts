import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { Repository } from 'typeorm';
import { listbanks } from './listbank.data';
import { ListBankSeed } from './listbank.interface';

@Injectable()
export class ListBankSeederService {
  constructor(
    @InjectRepository(ListBankDocument)
    private readonly listbankRepository: Repository<ListBankDocument>,
  ) {}

  create(): Array<Promise<ListBankDocument>> {
    return listbanks.map(async (listbank: ListBankSeed) => {
      return await this.listbankRepository
        .findOne({
          where: {
            bank_code: listbank.bank_code,
            bank_name: listbank.bank_name,
          },
        })
        // .execute()
        .then(async (response) => {
          if (response) {
            return Promise.resolve(null);
          }
          return Promise.resolve(
            await this.listbankRepository.create(listbank),
          );
        })
        .catch((error) => Promise.reject(error));
    });
  }
}
