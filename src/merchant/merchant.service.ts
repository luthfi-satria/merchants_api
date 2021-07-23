import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupDocument } from 'src/database/entities/group.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  async findMerchantByPhone(phone: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ where: { group_hp: phone } });
  }

  async findMerchantMerchantByPhone(phone: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { merchant_hp: phone },
    });
  }

  async findMerchantStoreByPhone(phone: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { store_hp: phone },
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
  ): Promise<GroupDocument> {
    const create_group: Partial<GroupDocument> = {
      id_group: data.id_group,
      group_name: data.group_name,
      owner_group_name: data.owner_group_name,
      group_email: data.group_email,
      group_hp: data.group_hp,
      address_group: data.address_group,
      create_date: data.create_date,
      approval_date: data.approval_date,
    };
    if (data.group_status != '' && typeof data.group_status != 'undefined')
      create_group.group_status = data.group_status;
    if (typeof data.upload_photo_ktp != 'undefined')
      create_group.upload_photo_ktp = data.upload_photo_ktp;
    return await this.groupRepository.save(create_group);
  }

  async createMerchantMerchantProfile(
    data: Record<string, any>,
  ): Promise<MerchantDocument> {
    const create_merchant: Partial<MerchantDocument> = {
      group_name: data.group_name,
      merchant_name: data.merchant_name,
      owner_merchant_name: data.owner_merchant_name,
      merchant_email: data.merchant_email,
      merchant_hp: data.merchant_hp,
      merchant_address: data.merchant_address,
      nik: data.nik,
      birth_city: data.birth_city,
      dob: data.dob,
      address_ktp: data.address_ktp,
      bank_name: data.bank_name,
      acc_number: data.acc_number,
      acc_name: data.acc_name,
      business_name: data.business_name,
      business_fields: data.business_fields,
      tarif_pb1: data.tarif_pb1,
      create_date: data.create_date,
      upload_photo_yourself_with_ktp: data.upload_photo_yourself_with_ktp,
      upload_bankbook: data.upload_bankbook,
      upload_photo_ktp: data.upload_photo_ktp,
    };
    if (
      data.merchant_status != '' &&
      typeof data.merchant_status != 'undefined'
    )
      create_merchant.merchant_status = data.merchant_status;
    return await this.merchantRepository.save(create_merchant);
  }

  async updateMerchantMerchantProfile(
    data: Record<string, any>,
  ): Promise<MerchantDocument> {
    const create_merchant: Partial<MerchantDocument> = {
      id_merchant: data.id_merchant,
      group_name: data.group_name,
      merchant_name: data.merchant_name,
      owner_merchant_name: data.owner_merchant_name,
      merchant_email: data.merchant_email,
      merchant_hp: data.merchant_hp,
      merchant_address: data.merchant_address,
      nik: data.nik,
      birth_city: data.birth_city,
      dob: data.dob,
      address_ktp: data.address_ktp,
      bank_name: data.bank_name,
      acc_number: data.acc_number,
      acc_name: data.acc_name,
      business_name: data.business_name,
      business_fields: data.business_fields,
      tarif_pb1: data.tarif_pb1,
      create_date: data.create_date,
      approval_date: data.approval_date,
    };
    console.log('data');
    console.log(data);

    if (
      data.merchant_status != '' &&
      typeof data.merchant_status != 'undefined'
    )
      create_merchant.merchant_status = data.merchant_status;
    if (
      data.upload_photo_ktp != '' &&
      typeof data.upload_photo_ktp != 'undefined'
    )
      create_merchant.upload_photo_ktp = data.upload_photo_ktp;
    if (
      data.upload_photo_yourself_with_ktp != '' &&
      typeof data.upload_photo_yourself_with_ktp != 'undefined'
    )
      create_merchant.upload_photo_yourself_with_ktp =
        data.upload_photo_yourself_with_ktp;
    if (
      data.upload_bankbook != '' &&
      typeof data.upload_bankbook != 'undefined'
    )
      create_merchant.upload_bankbook = data.upload_bankbook;
    console.log('create merchant');
    console.log(create_merchant);

    return await this.merchantRepository.save(create_merchant);
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

  async deleteMerchantGroupProfile(data: string): Promise<any> {
    const delete_group: Partial<GroupDocument> = {
      id_group: data,
    };
    return this.groupRepository.delete(delete_group);
  }

  async deleteMerchantMerchantProfile(data: string): Promise<any> {
    const delete_merchant: Partial<MerchantDocument> = {
      id_merchant: data,
    };
    return this.merchantRepository.delete(delete_merchant);
  }

  async deleteMerchantStoreProfile(data: string): Promise<any> {
    const delete_merchant: Partial<StoreDocument> = {
      id_store: data,
    };
    return this.storeRepository.delete(delete_merchant);
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
      .take(data.page)
      .printSql()
      .getRawMany();
  }

  async listGroupMerchant(
    data: Record<string, any>,
  ): Promise<Promise<MerchantDocument>[]> {
    return await this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .select('*')
      .where('group_name like :name', { name: '%' + data.search + '%' })
      .orWhere('merchant_name like :mname', {
        mname: '%' + data.search + '%',
      })
      .orWhere('owner_merchant_name like :omname', {
        omname: '%' + data.search + '%',
      })
      .orWhere('merchant_email like :memail', {
        memail: '%' + data.search + '%',
      })
      .orWhere('merchant_hp like :mlike', {
        mlike: '%' + data.search + '%',
      })
      .orWhere('merchant_address like :maddress', {
        maddress: '%' + data.search + '%',
      })
      .orWhere('nik like :nik', {
        nik: '%' + data.search + '%',
      })
      .orWhere('birth_city like :bcity', {
        bcity: '%' + data.search + '%',
      })
      .orWhere('address_ktp like :aktp', {
        aktp: '%' + data.search + '%',
      })
      .orWhere('bank_name like :bname', {
        bname: '%' + data.search + '%',
      })
      .orWhere('acc_number like :acn', {
        acn: '%' + data.search + '%',
      })
      .orWhere('business_name like :buname', {
        buname: '%' + data.search + '%',
      })
      .orWhere('business_fields like :bfield', {
        bfield: '%' + data.search + '%',
      })
      .limit(data.limit)
      .take(data.page)
      .printSql()
      .getRawMany();
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
      .take(data.page)
      .printSql()
      .getRawMany();
  }
}
