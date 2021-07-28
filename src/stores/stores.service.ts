import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
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
    private httpService: HttpService,
  ) {}

  async findMerchantById(id: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { store_id: id },
    });
  }

  async findMerchantStoreByPhone(hp: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { owner_phone: hp },
    });
  }

  async findMerchantStoreByEmail(email: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { owner_email: email },
    });
  }

  async createMerchantStoreProfile(
    data: Record<string, any>,
  ): Promise<StoreDocument> {
    const create_store: Partial<StoreDocument> = {
      merchant_id: data.merchant_id,
      name: data.name,
      phone: data.phone,
      owner_phone: data.owner_phone,
      owner_email: data.owner_email,
      owner_password: data.owner_password,
      address: data.address,
      post_code: data.post_code,
      guidance: data.guidance,
      location_longitude: data.location_longitude,
      location_latitude: data.location_latitude,
      service_addon: data.service_addon,
    };
    if (data.upload_photo != '' && typeof data.upload_photo != 'undefined')
      create_store.upload_photo = data.upload_photo;
    return await this.storeRepository.save(create_store);
  }

  async updateMerchantStoreProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const create_store: Partial<StoreDocument> = {};
    if (
      data.merchant_id != null &&
      data.merchant_id != '' &&
      typeof data.merchant_id != 'undefined'
    )
      create_store.merchant_id = data.merchant_id;
    if (data.name != null && data.name != '' && typeof data.name != 'undefined')
      create_store.name = data.name;
    if (
      data.phone != null &&
      data.phone != '' &&
      typeof data.phone != 'undefined'
    )
      create_store.phone = data.phone;
    if (
      data.owner_phone != null &&
      data.owner_phone != '' &&
      typeof data.owner_phone != 'undefined'
    )
      create_store.owner_phone = data.owner_phone;
    if (
      data.owner_email != null &&
      data.owner_email != '' &&
      typeof data.owner_email != 'undefined'
    )
      create_store.owner_email = data.owner_email;
    if (
      data.owner_password != null &&
      data.owner_password != '' &&
      typeof data.owner_password != 'undefined'
    )
      create_store.owner_password = data.owner_password;
    if (
      data.address != null &&
      data.address != '' &&
      typeof data.address != 'undefined'
    )
      create_store.address = data.address;
    if (
      data.post_code != null &&
      data.post_code != '' &&
      typeof data.post_code != 'undefined'
    )
      create_store.post_code = data.post_code;
    if (
      data.guidance != null &&
      data.guidance != '' &&
      typeof data.guidance != 'undefined'
    )
      create_store.guidance = data.guidance;
    if (
      data.location_longitude != null &&
      data.location_longitude != '' &&
      typeof data.location_longitude != 'undefined'
    )
      create_store.location_longitude = data.location_longitude;
    if (
      data.location_latitude != null &&
      data.location_latitude != '' &&
      typeof data.location_latitude != 'undefined'
    )
      create_store.location_latitude = data.location_latitude;
    if (
      data.service_addon != null &&
      data.service_addon != '' &&
      typeof data.service_addon != 'undefined'
    )
      create_store.service_addon = data.service_addon;
    if (
      data.upload_photo != null &&
      data.upload_photo != '' &&
      typeof data.upload_photo != 'undefined'
    )
      create_store.upload_photo = data.upload_photo;

    return this.storeRepository
      .createQueryBuilder('merchant_store')
      .update(StoreDocument)
      .set(create_store)
      .where('store_id= :id', { id: data.store_id })
      .returning('*')
      .execute()
      .then((response) => {
        console.log(response.raw[0]);
        return response.raw[0];
      });
  }

  async deleteMerchantStoreProfile(data: string): Promise<any> {
    const delete_merchant: Partial<StoreDocument> = {
      store_id: data,
    };
    return this.storeRepository.delete(delete_merchant);
  }

  async listGroupStore(
    data: Record<string, any>,
  ): Promise<Promise<StoreDocument>[]> {
    if (typeof data.search == 'undefined' || data.search == null)
      data.search = '';
    if (typeof data.limit == 'undefined' || data.limit == null) data.limit = 10;
    if (typeof data.page == 'undefined' || data.page == null) {
      data.page = 0;
    } else {
      data.page -= 1;
    }
    return await this.storeRepository
      .createQueryBuilder('merchant_store')
      .select('*')
      .where('store_id like :mid', { mid: '%' + data.search + '%' })
      .orWhere('name like :mname', {
        mname: '%' + data.search + '%',
      })
      .orWhere('phone like :sname', {
        sname: '%' + data.search + '%',
      })
      .orWhere('owner_phone like :shp', {
        shp: '%' + data.search + '%',
      })
      .orWhere('owner_email like :smail', {
        smail: '%' + data.search + '%',
      })
      .orWhere('owner_password like :esettle', {
        esettle: '%' + data.search + '%',
      })
      .orWhere('address like :astrore', {
        astrore: '%' + data.search + '%',
      })
      .orWhere('post_code like :pcode', {
        pcode: '%' + data.search + '%',
      })
      .orWhere('guidance like :guidance', {
        guidance: '%' + data.search + '%',
      })
      .orWhere('location_longitude like :lat', {
        lat: '%' + data.search + '%',
      })
      .orWhere('location_latitude like :lat', {
        lat: '%' + data.search + '%',
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
