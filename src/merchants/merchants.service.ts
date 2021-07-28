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
      where: { merchant_id: id },
    });
  }

  async findMerchantMerchantByPhone(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { owner_phone: id },
    });
  }

  async findMerchantMerchantByEmail(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { owner_email: id },
    });
  }

  async createMerchantMerchantProfile(
    data: Record<string, any>,
  ): Promise<MerchantDocument> {
    const create_merchant: Partial<MerchantDocument> = {
      group_id: data.group_id,
      name: data.name,
      lob_id: data.lob_id,
      address: data.address,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
      owner_phone: data.owner_phone,
      owner_password: data.owner_password,
      owner_nik: data.owner_nik,
      owner_dob: data.owner_dob,
      owner_dob_city: data.owner_dob_city,
      owner_address: data.owner_address,
      bank_id: data.bank_id,
      bank_acc_name: data.bank_acc_name,
      bank_acc_number: data.bank_acc_number,
      tarif_pb1: data.tarif_pb1,
    };
    if (
      data.status != null &&
      data.status != '' &&
      typeof data.status != 'undefined'
    )
      create_merchant.status = data.status;
    if (
      data.owner_ktp != null &&
      data.owner_ktp != '' &&
      typeof data.owner_ktp != 'undefined'
    )
      create_merchant.owner_ktp = data.owner_ktp;
    if (
      data.owner_face_ktp != null &&
      data.owner_face_ktp != '' &&
      typeof data.owner_face_ktp != 'undefined'
    )
      create_merchant.owner_face_ktp = data.owner_face_ktp;
    return await this.merchantRepository.save(create_merchant);
  }

  async updateMerchantMerchantProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const create_merchant: Partial<MerchantDocument> = {};
    if (
      data.group_id != null &&
      data.group_id != '' &&
      typeof data.group_id != 'undefined'
    )
      create_merchant.group_id = data.group_id;
    if (data.name != null && data.name != '' && typeof data.name != 'undefined')
      create_merchant.name = data.name;
    if (
      data.lob_id != null &&
      data.lob_id != '' &&
      typeof data.lob_id != 'undefined'
    )
      create_merchant.lob_id = data.lob_id;
    if (
      data.address != null &&
      data.address != '' &&
      typeof data.address != 'undefined'
    )
      create_merchant.address = data.address;
    if (
      data.owner_name != null &&
      data.owner_name != '' &&
      typeof data.owner_name != 'undefined'
    )
      create_merchant.owner_name = data.owner_name;
    if (
      data.owner_email != null &&
      data.owner_email != '' &&
      typeof data.owner_email != 'undefined'
    )
      create_merchant.owner_email = data.owner_email;
    if (
      data.owner_phone != null &&
      data.owner_phone != '' &&
      typeof data.owner_phone != 'undefined'
    )
      create_merchant.owner_phone = data.owner_phone;
    if (
      data.owner_password != null &&
      data.owner_password != '' &&
      typeof data.owner_password != 'undefined'
    )
      create_merchant.owner_password = data.owner_password;
    if (
      data.owner_nik != null &&
      data.owner_nik != '' &&
      typeof data.owner_nik != 'undefined'
    )
      create_merchant.owner_nik = data.owner_nik;
    if (
      data.owner_dob != null &&
      data.owner_dob != '' &&
      typeof data.owner_dob != 'undefined'
    )
      create_merchant.owner_dob = data.owner_dob;
    if (
      data.owner_dob_city != null &&
      data.owner_dob_city != '' &&
      typeof data.owner_dob_city != 'undefined'
    )
      create_merchant.owner_dob_city = data.owner_dob_city;
    if (
      data.owner_address != null &&
      data.owner_address != '' &&
      typeof data.owner_address != 'undefined'
    )
      create_merchant.owner_address = data.owner_address;
    if (
      data.bank_id != null &&
      data.bank_id != '' &&
      typeof data.bank_id != 'undefined'
    )
      create_merchant.bank_id = data.bank_id;
    if (
      data.bank_acc_name != null &&
      data.bank_acc_name != '' &&
      typeof data.bank_acc_name != 'undefined'
    )
      create_merchant.bank_acc_name = data.bank_acc_name;
    if (
      data.bank_acc_number != null &&
      data.bank_acc_number != '' &&
      typeof data.bank_acc_number != 'undefined'
    )
      create_merchant.bank_acc_number = data.bank_acc_number;
    if (
      data.tarif_pb1 != null &&
      data.tarif_pb1 != '' &&
      typeof data.tarif_pb1 != 'undefined'
    )
      create_merchant.tarif_pb1 = data.tarif_pb1;
    if (
      data.status != null &&
      data.status != '' &&
      typeof data.status != 'undefined'
    )
      create_merchant.status = data.status;
    if (data.status == 'ACTIVE') {
      create_merchant.approved_at = new Date();
    }
    if (
      data.owner_ktp != null &&
      data.owner_ktp != '' &&
      typeof data.owner_ktp != 'undefined'
    )
      create_merchant.owner_ktp = data.owner_ktp;
    if (
      data.owner_face_ktp != null &&
      data.owner_face_ktp != '' &&
      typeof data.owner_face_ktp != 'undefined'
    )
      create_merchant.owner_face_ktp = data.owner_face_ktp;
    return await this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .update(MerchantDocument)
      .set(create_merchant)
      .where('merchant_id= :id', { id: data.merchant_id })
      .execute()
      .then((response) => {
        console.log(response.raw[0]);
        return response.raw[0];
      });
  }

  async deleteMerchantMerchantProfile(data: string): Promise<any> {
    const delete_merchant: Partial<MerchantDocument> = {
      merchant_id: data,
    };
    return this.merchantRepository.delete(delete_merchant);
  }

  async listGroupMerchant(
    data: Record<string, any>,
  ): Promise<Promise<MerchantDocument>[]> {
    if (typeof data.search == 'undefined' || data.search == null)
      data.search = '';
    if (typeof data.limit == 'undefined' || data.limit == null) data.limit = 10;
    if (typeof data.page == 'undefined' || data.page == null) {
      data.page = 0;
    } else {
      data.page -= 1;
    }
    return await this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .select('*')
      .where('group_id like :gid', { gid: '%' + data.search + '%' })
      .orWhere('name like :mname', {
        mname: '%' + data.search + '%',
      })
      .orWhere('lob_id like :lid', {
        lid: '%' + data.search + '%',
      })
      .orWhere('address like :addr', {
        addr: '%' + data.search + '%',
      })
      .orWhere('owner_name like :oname', {
        oname: '%' + data.search + '%',
      })
      .orWhere('owner_email like :omail', {
        omail: '%' + data.search + '%',
      })
      .orWhere('owner_phone like :ophone', {
        ophone: '%' + data.search + '%',
      })
      .orWhere('owner_password like :opass', {
        opass: '%' + data.search + '%',
      })
      .orWhere('owner_nik like :onik', {
        onik: '%' + data.search + '%',
      })
      // .orWhere('owner_dob like :odob', {
      //   odob: '%' + data.search + '%',
      // })
      .orWhere('owner_dob_city like :odc', {
        odc: '%' + data.search + '%',
      })
      .orWhere('owner_address like :oaddr', {
        oaddr: '%' + data.search + '%',
      })
      .orWhere('bank_id like :bid', {
        bid: '%' + data.search + '%',
      })
      .orWhere('bank_acc_name like :ban', {
        ban: '%' + data.search + '%',
      })
      .orWhere('bank_acc_number like :banu', {
        banu: '%' + data.search + '%',
      })
      .orWhere('tarif_pb1 like :tpb', {
        tpb: '%' + data.search + '%',
      })
      .orderBy('created_at', 'DESC')
      .limit(data.limit)
      .offset(data.page)
      .getRawMany();
  }
}
