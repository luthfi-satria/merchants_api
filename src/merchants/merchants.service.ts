import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
  ) {}

  async findMerchantById(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { id_merchant: id },
    });
  }

  async findMerchantMerchantByPhone(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { merchant_hp: id },
    });
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

  async deleteMerchantMerchantProfile(data: string): Promise<any> {
    const delete_merchant: Partial<MerchantDocument> = {
      id_merchant: data,
    };
    return this.merchantRepository.delete(delete_merchant);
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
      .offset(data.page)
      .printSql()
      .getRawMany();
  }
}
