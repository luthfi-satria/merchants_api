import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GroupDocument } from 'src/database/entities/group.entity';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    private httpService: HttpService,
  ) {}

  async findMerchantById(id: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ group_id: id });
  }

  async findMerchantByPhone(phone: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ where: { phone: phone } });
  }

  async findMerchantByEmail(email: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({
      where: { email: email },
    });
  }

  async createMerchantGroupProfile(
    data: Record<string, any>,
  ): Promise<GroupDocument> {
    const create_group: Partial<GroupDocument> = {
      name: data.name,
      owner_name: data.owner_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };
    if (
      data.status != null &&
      data.status != '' &&
      typeof data.status != 'undefined'
    )
      create_group.status = data.status;
    if (
      data.owner_ktp != null &&
      data.owner_ktp != '' &&
      typeof data.owner_ktp != 'undefined'
    )
      create_group.owner_ktp = data.owner_ktp;
    return await this.groupRepository.save(create_group);
  }

  async updateMerchantGroupProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const create_group: Partial<GroupDocument> = {};
    if (typeof data.name != 'undefined' && data.name != null && data.name != '')
      create_group.name = data.name;
    if (
      typeof data.status != 'undefined' &&
      data.status != null &&
      data.status != ''
    )
      create_group.status = data.status;
    if (data.status == 'ACTIVE') {
      create_group.approved_at = new Date();
    }
    if (
      typeof data.owner_name != 'undefined' &&
      data.owner_name != null &&
      data.owner_name != ''
    )
      create_group.owner_name = data.owner_name;
    if (
      typeof data.owner_ktp != 'undefined' &&
      data.owner_ktp != null &&
      data.owner_ktp != ''
    )
      create_group.owner_ktp = data.owner_ktp;
    if (
      typeof data.email != 'undefined' &&
      data.email != null &&
      data.email != ''
    )
      create_group.email = data.email;
    if (
      typeof data.phone != 'undefined' &&
      data.phone != null &&
      data.phone != ''
    )
      create_group.phone = data.phone;
    if (
      typeof data.address != 'undefined' &&
      data.address != null &&
      data.address != ''
    )
      create_group.address = data.address;

    return this.groupRepository
      .createQueryBuilder('merchant_group')
      .update(GroupDocument)
      .set(create_group)
      .where('group_id= :id', { id: data.group_id })
      .returning('*')
      .execute()
      .then((response) => {
        console.log(response.raw[0]);
        return response.raw[0];
      });
  }

  async deleteMerchantGroupProfile(data: string): Promise<any> {
    const delete_group: Partial<GroupDocument> = {
      group_id: data,
    };
    return this.groupRepository.delete(delete_group);
  }

  async listGroup(
    data: Record<string, any>,
  ): Promise<Promise<GroupDocument>[]> {
    if (typeof data.search == 'undefined' || data.search == null)
      data.search = '';
    if (typeof data.limit == 'undefined' || data.limit == null) data.limit = 10;
    if (typeof data.page == 'undefined' || data.page == null) {
      data.page = 0;
    } else {
      data.page -= 1;
    }
    return await this.groupRepository
      .createQueryBuilder('merchant_group')
      .select('*')
      .where('name like :name', { name: '%' + data.search + '%' })
      .orWhere('owner_name like :oname', {
        oname: '%' + data.search + '%',
      })
      .orWhere('email like :email', {
        email: '%' + data.search + '%',
      })
      .orWhere('phone like :ghp', {
        ghp: '%' + data.search + '%',
      })
      .orWhere('address like :adg', {
        adg: '%' + data.search + '%',
      })
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
