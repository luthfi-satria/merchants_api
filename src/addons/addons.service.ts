import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { AddonDocument } from 'src/database/entities/addons.entity';

@Injectable()
export class AddonsService {
  constructor(
    @InjectRepository(AddonDocument)
    private readonly addonRepository: Repository<AddonDocument>,
    private httpService: HttpService,
  ) {}

  async findMerchantById(id: string): Promise<AddonDocument> {
    return await this.addonRepository.findOne({ addon_id: id });
  }

  async findMerchantByName(name: string): Promise<AddonDocument> {
    return await this.addonRepository.findOne({ where: { name: name } });
  }

  async createMerchantAddonProfile(
    data: Record<string, any>,
  ): Promise<AddonDocument> {
    const create_lob: Partial<AddonDocument> = {
      name: data.name,
    };
    return await this.addonRepository.save(create_lob);
  }

  async updateMerchantAddonProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const create_lob: Partial<AddonDocument> = {
      name: data.name,
    };

    return this.addonRepository
      .createQueryBuilder('merchant_addons')
      .update(AddonDocument)
      .set(create_lob)
      .where('addon_id= :id', { id: data.addon_id })
      .returning('*')
      .execute()
      .then((response) => {
        console.log(response.raw[0]);
        return response.raw[0];
      });
  }

  async deleteMerchantAddonProfile(id: string): Promise<any> {
    const delete_group: Partial<AddonDocument> = {
      addon_id: id,
    };
    return this.addonRepository.delete(delete_group);
  }

  async listGroup(
    data: Record<string, any>,
  ): Promise<Promise<AddonDocument>[]> {
    if (typeof data.search == 'undefined' || data.search == null)
      data.search = '';
    if (typeof data.limit == 'undefined' || data.limit == null) data.limit = 10;
    if (typeof data.page == 'undefined' || data.page == null) {
      data.page = 0;
    } else {
      data.page -= 1;
    }
    return await this.addonRepository
      .createQueryBuilder('merchant_addons')
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
