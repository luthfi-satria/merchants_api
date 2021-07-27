import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GroupDocument } from 'src/database/entities/group.entity';
import { Repository, UpdateResult } from 'typeorm';
import { AxiosResponse } from 'axios';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    private httpService: HttpService,
  ) {}

  async findMerchantById(id: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ id_group: id });
  }

  async findMerchantByPhone(phone: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ where: { group_hp: phone } });
  }

  async findMerchantByEmail(email: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({
      where: { group_email: email },
    });
  }

  async createMerchantGroupProfile(
    data: Record<string, any>,
  ): Promise<GroupDocument> {
    const create_group: Partial<GroupDocument> = {
      group_name: data.group_name,
      owner_group_name: data.owner_group_name,
      group_email: data.group_email,
      group_hp: data.group_hp,
      address_group: data.address_group,
      create_date: data.create_date,
    };
    if (data.group_status != '' && typeof data.group_status != 'undefined')
      create_group.group_status = data.group_status;
    if (typeof data.upload_photo_ktp != 'undefined')
      create_group.upload_photo_ktp = data.upload_photo_ktp;
    return await this.groupRepository.save(create_group);
  }

  async updateMerchantGroupProfile(
    data: Record<string, any>,
  ): Promise<UpdateResult> {
    const create_group: Partial<GroupDocument> = {};
    // const create_group: Partial<GroupDocument> = {
    //   id_group: data.id_group,
    //   group_name: data.group_name,
    //   owner_group_name: data.owner_group_name,
    //   group_email: data.group_email,
    //   group_hp: data.group_hp,
    //   address_group: data.address_group,
    //   create_date: data.create_date,
    //   approval_date: data.approval_date,
    // };
    if (
      typeof data.group_name != 'undefined' &&
      data.group_name != null &&
      data.group_name != ''
    )
      create_group.group_name = data.group_name;
    if (
      typeof data.group_status != 'undefined' &&
      data.group_status != null &&
      data.group_status != ''
    )
      create_group.group_status = data.group_status;
    if (data.group_status == 'APPROVED') {
      create_group.approval_date = new Date();
    }
    if (
      typeof data.owner_group_name != 'undefined' &&
      data.owner_group_name != null &&
      data.owner_group_name != ''
    )
      create_group.owner_group_name = data.owner_group_name;
    if (
      typeof data.upload_photo_ktp != 'undefined' &&
      data.upload_photo_ktp != null &&
      data.upload_photo_ktp != ''
    )
      create_group.upload_photo_ktp = data.upload_photo_ktp;
    if (
      typeof data.group_email != 'undefined' &&
      data.group_email != null &&
      data.group_email != ''
    )
      create_group.group_email = data.group_email;
    if (
      typeof data.group_hp != 'undefined' &&
      data.group_hp != null &&
      data.group_hp != ''
    )
      create_group.group_hp = data.group_hp;
    if (
      typeof data.address_group != 'undefined' &&
      data.address_group != null &&
      data.address_group != ''
    )
      create_group.address_group = data.address_group;

    return await this.groupRepository
      .createQueryBuilder('merchant_group')
      .update(GroupDocument)
      .set(create_group)
      .where('id_group= :id', { id: data.id_group })
      .execute();
  }

  async deleteMerchantGroupProfile(data: string): Promise<any> {
    const delete_group: Partial<GroupDocument> = {
      id_group: data,
    };
    return this.groupRepository.delete(delete_group);
  }

  async listGroup(
    data: Record<string, any>,
  ): Promise<Promise<GroupDocument>[]> {
    return await this.groupRepository
      .createQueryBuilder('merchant_group')
      .select('*')
      .where('group_name like :name', { name: '%' + data.search + '%' })
      .orWhere('owner_group_name like :oname', {
        oname: '%' + data.search + '%',
      })
      .orWhere('group_email like :email', {
        email: '%' + data.search + '%',
      })
      .orWhere('group_hp like :ghp', {
        ghp: '%' + data.search + '%',
      })
      .orWhere('address_group like :adg', {
        adg: '%' + data.search + '%',
      })
      .limit(data.limit)
      .offset(data.page)
      .printSql()
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
