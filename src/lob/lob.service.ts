import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { LobDocument } from 'src/database/entities/lob.entity';

@Injectable()
export class LobService {
  constructor(
    @InjectRepository(LobDocument)
    private readonly lobRepository: Repository<LobDocument>,
    private httpService: HttpService,
  ) {}

  async findMerchantById(id: string): Promise<LobDocument> {
    return await this.lobRepository.findOne({ lob_id: id });
  }

  async findMerchantByName(name: string): Promise<LobDocument> {
    return await this.lobRepository.findOne({ where: { name: name } });
  }

  async createMerchantLobProfile(
    data: Record<string, any>,
  ): Promise<LobDocument> {
    const create_lob: Partial<LobDocument> = {
      name: data.name,
    };
    return await this.lobRepository.save(create_lob);
  }

  async updateMerchantLobProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const create_lob: Partial<LobDocument> = {
      name: data.name,
    };

    return this.lobRepository
      .createQueryBuilder('merchant_lob')
      .update(LobDocument)
      .set(create_lob)
      .where('lob_id= :id', { id: data.lob_id })
      .returning('*')
      .execute()
      .then((response) => {
        console.log(response.raw[0]);
        return response.raw[0];
      });
  }

  async deleteMerchantLobProfile(id: string): Promise<any> {
    const delete_group: Partial<LobDocument> = {
      lob_id: id,
    };
    return this.lobRepository.delete(delete_group);
  }

  async listGroup(data: Record<string, any>): Promise<Promise<LobDocument>[]> {
    if (typeof data.search == 'undefined' || data.search == null)
      data.search = '';
    if (typeof data.limit == 'undefined' || data.limit == null) data.limit = 10;
    if (typeof data.page == 'undefined' || data.page == null) {
      data.page = 0;
    } else {
      data.page -= 1;
    }
    return await this.lobRepository
      .createQueryBuilder('merchant_lob')
      .select('*')
      .where('name like :aname', { aname: '%' + data.search + '%' })
      .orderBy('created_at', 'DESC')
      .limit(data.limit)
      .offset(data.page)
      .getRawMany();
  }

  //------------------------------------------------------------------------------

  async getHttp(
    url: string,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.get(url, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
