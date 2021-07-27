import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  async findMerchantById(id: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { id_store: id },
    });
  }

  async findMerchantStoreByPhone(hp: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { store_hp: hp },
    });
  }

  async createMerchantStoreProfile(
    data: Record<string, any>,
  ): Promise<StoreDocument> {
    const create_store: Partial<StoreDocument> = {
      group_name: data.group_name,
      merchant_name: data.merchant_name,
      store_name: data.store_name,
      store_phone: data.store_phone,
      store_hp: data.store_hp,
      store_email: data.store_email,
      email_settlement: data.email_settlement,
      address_store: data.address_store,
      post_code: data.post_code,
      guidance: data.guidance,
      longitude_latitude: data.longitude_latitude,
      upload_photo_store: data.upload_photo_store,
      toc: data.toc,
      create_date: data.create_date,
    };
    if (data.services_addon != '' && typeof data.services_addon != 'undefined')
      create_store.services_addon = data.services_addon;
    return await this.storeRepository.save(create_store);
  }

  async updateMerchantStoreProfile(
    data: Record<string, any>,
  ): Promise<StoreDocument> {
    const create_store: Partial<StoreDocument> = {
      id_store: data.id_store,
      group_name: data.group_name,
      merchant_name: data.merchant_name,
      store_name: data.store_name,
      store_phone: data.store_phone,
      store_hp: data.store_hp,
      store_email: data.store_email,
      email_settlement: data.email_settlement,
      address_store: data.address_store,
      post_code: data.post_code,
      guidance: data.guidance,
      longitude_latitude: data.longitude_latitude,
      toc: data.toc,
      create_date: data.create_date,
      approval_date: data.approval_date,
    };
    console.log('data');
    console.log(data);
    if (
      data.upload_photo_store != '' &&
      typeof data.upload_photo_store != 'undefined'
    )
      create_store.upload_photo_store = data.upload_photo_store;
    if (data.services_addon != '' && typeof data.services_addon != 'undefined')
      create_store.services_addon = data.services_addon;
    return await this.storeRepository.save(create_store);
  }

  async deleteMerchantStoreProfile(data: string): Promise<any> {
    const delete_merchant: Partial<StoreDocument> = {
      id_store: data,
    };
    return this.storeRepository.delete(delete_merchant);
  }

  async listGroupStore(
    data: Record<string, any>,
  ): Promise<Promise<StoreDocument>[]> {
    return await this.storeRepository
      .createQueryBuilder('merchant_store')
      .select('*')
      .where('group_name like :name', { name: '%' + data.search + '%' })
      .orWhere('merchant_name like :mname', {
        mname: '%' + data.search + '%',
      })
      .orWhere('store_name like :sname', {
        sname: '%' + data.search + '%',
      })
      .orWhere('store_hp like :shp', {
        shp: '%' + data.search + '%',
      })
      .orWhere('store_email like :smail', {
        smail: '%' + data.search + '%',
      })
      .orWhere('email_settlement like :esettle', {
        esettle: '%' + data.search + '%',
      })
      .orWhere('address_store like :astrore', {
        astrore: '%' + data.search + '%',
      })
      .orWhere('post_code like :pcode', {
        pcode: '%' + data.search + '%',
      })
      .orWhere('guidance like :guidance', {
        guidance: '%' + data.search + '%',
      })
      .orWhere('longitude_latitude like :lat', {
        lat: '%' + data.search + '%',
      })
      .orWhere('services_addon like :sadd', {
        sadd: '%' + data.search + '%',
      })
      .orWhere('toc like :toc', {
        toc: '%' + data.search + '%',
      })
      .limit(data.limit)
      .offset(data.page)
      .printSql()
      .getRawMany();
  }
}
