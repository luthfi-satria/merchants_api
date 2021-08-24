import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { AddonsService } from 'src/addons/addons.service';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly addonService: AddonsService,
    private httpService: HttpService,
    private readonly merchantService: MerchantsService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async listGroupStore(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    let totalItems: number;

    return await this.storeRepository
      .createQueryBuilder('merchant_store')
      .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
      .where('lower(merchant_store.name) like :mname', {
        mname: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.phone) like :sname', {
        sname: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.owner_phone) like :shp', {
        shp: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.owner_email) like :smail', {
        smail: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.address) like :astrore', {
        astrore: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.post_code) like :pcode', {
        pcode: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.guidance) like :guidance', {
        guidance: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.location_longitude) like :long', {
        long: '%' + search + '%',
      })
      .orWhere('lower(merchant_store.location_latitude) like :lat', {
        lat: '%' + search + '%',
      })
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.storeRepository
          .createQueryBuilder('merchant_store')
          .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
          .where('lower(merchant_store.name) like :mname', {
            mname: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.phone) like :sname', {
            sname: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.owner_phone) like :shp', {
            shp: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.owner_email) like :smail', {
            smail: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.address) like :astrore', {
            astrore: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.post_code) like :pcode', {
            pcode: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.guidance) like :guidance', {
            guidance: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.location_longitude) like :long', {
            long: '%' + search + '%',
          })
          .orWhere('lower(merchant_store.location_latitude) like :lat', {
            lat: '%' + search + '%',
          })
          .orderBy('merchant_store.created_at', 'DESC')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getMany();
      })
      .then((result) => {
        result.forEach((row) => {
          dbOutputTime(row);
          delete row.owner_password;
          row.service_addon.forEach((sao) => {
            delete sao.created_at;
            delete sao.updated_at;
          });
        });
        const list_result: ListResponse = {
          total_item: totalItems,
          limit: Number(perPage),
          current_page: Number(currentPage),
          items: result,
        };
        return list_result;
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