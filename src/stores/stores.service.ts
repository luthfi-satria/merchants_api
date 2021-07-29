import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
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
    return await this.storeRepository
      .findOne({
        where: { id: id },
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
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
    return await this.storeRepository
      .save(create_store)
      .then((result) => {
        dbOutputTime(result);
        delete result.owner_password;
        return result;
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
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
      .where('id= :id', { id: data.id })
      .returning('*')
      .execute()
      .then(async () => {
        const result: Record<string, any> = await this.storeRepository.findOne({
          where: { id: data.id },
        });
        dbOutputTime(result);
        console.log(result);
        delete result.owner_password;
        return result;
      })
      .catch((err) => {
        console.log(err);
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async deleteMerchantStoreProfile(data: string): Promise<any> {
    const delete_merchant: Partial<StoreDocument> = {
      id: data,
    };
    return this.storeRepository
      .delete(delete_merchant)
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((err) => {
        console.log(err);
        const errors: RMessage = {
          value: data,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.deletestore.invalid_id'),
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async listGroupStore(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    let totalItems: number;

    return await this.storeRepository
      .createQueryBuilder('merchant_store')
      .select('*')
      // .where('merchant_id like :mid', { mid: '%' + data.search + '%' })
      .where('lower(name like :mname', {
        mname: '%' + search + '%',
      })
      .orWhere('lower(phone) like :sname', {
        sname: '%' + search + '%',
      })
      .orWhere('lower(owner_phone) like :shp', {
        shp: '%' + search + '%',
      })
      .orWhere('lower(owner_email) like :smail', {
        smail: '%' + search + '%',
      })
      // .orWhere('lower(owner_password) like :esettle', {
      //   esettle: '%' + search + '%',
      // })
      .orWhere('lower(address) like :astrore', {
        astrore: '%' + search + '%',
      })
      .orWhere('lower(post_code) like :pcode', {
        pcode: '%' + search + '%',
      })
      .orWhere('lower(guidance) like :guidance', {
        guidance: '%' + search + '%',
      })
      .orWhere('lower(location_longitude) like :lat', {
        lat: '%' + search + '%',
      })
      .orWhere('lower(location_latitude) like :lat', {
        lat: '%' + search + '%',
      })
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.storeRepository
          .createQueryBuilder('merchant_store')
          .select('*')
          // .where('merchant_id like :mid', { mid: '%' + data.search + '%' })
          .where('lower(name like :mname', {
            mname: '%' + search + '%',
          })
          .orWhere('lower(phone) like :sname', {
            sname: '%' + search + '%',
          })
          .orWhere('lower(owner_phone) like :shp', {
            shp: '%' + search + '%',
          })
          .orWhere('lower(owner_email) like :smail', {
            smail: '%' + search + '%',
          })
          // .orWhere('lower(owner_password) like :esettle', {
          //   esettle: '%' + search + '%',
          // })
          .orWhere('lower(address) like :astrore', {
            astrore: '%' + search + '%',
          })
          .orWhere('lower(post_code) like :pcode', {
            pcode: '%' + search + '%',
          })
          .orWhere('lower(guidance) like :guidance', {
            guidance: '%' + search + '%',
          })
          .orWhere('lower(location_longitude) like :lat', {
            lat: '%' + search + '%',
          })
          .orWhere('lower(location_latitude) like :lat', {
            lat: '%' + search + '%',
          })
          .orderBy('created_at', 'DESC')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getRawMany();
      })
      .then((result) => {
        result.forEach((row) => {
          dbOutputTime(row);
          delete row.owner_password;
        });

        return {
          total_item: totalItems,
          limit: perPage,
          current_page: currentPage,
          items: result,
        };
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
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
