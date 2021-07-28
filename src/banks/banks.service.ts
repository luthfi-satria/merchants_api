import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListBankDocument } from 'src/database/entities/list_banks';
import { Repository } from 'typeorm';

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(ListBankDocument)
    private readonly bankRepository: Repository<ListBankDocument>,
  ) {}

  async listBanks(
    data: Record<string, any>,
  ): Promise<Promise<ListBankDocument>[]> {
    if (typeof data.search == 'undefined' || data.search == null)
      data.search = '';
    if (typeof data.limit == 'undefined' || data.limit == null) data.limit = 10;
    if (typeof data.page == 'undefined' || data.page == null) {
      data.page = 0;
    } else {
      data.page -= 1;
    }
    return await this.bankRepository
      .createQueryBuilder('merchant_list_banks')
      .select('*')
      .where('bank_code like :bcode', { bcode: '%' + data.search + '%' })
      .orWhere('bank_name like :bname', {
        bname: '%' + data.search + '%',
      })
      .orderBy('bank_code')
      .limit(data.limit)
      .offset(data.page)
      .getRawMany();
  }
}
