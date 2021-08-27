import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { LobDocument } from 'src/database/entities/lob.entity';
import { dbOutputTime } from 'src/utils/general-utils';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';

@Injectable()
export class LobService {
  constructor(
    @InjectRepository(LobDocument)
    private readonly lobRepository: Repository<LobDocument>,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
  ) {}

  async findMerchantById(id: string): Promise<LobDocument> {
    return await this.lobRepository.findOne({ id: id });
  }

  async findMerchantByName(name: string): Promise<LobDocument> {
    return await this.lobRepository.findOne({ where: { name: name } });
  }

  async createMerchantLobProfile(
    data: Record<string, any>,
  ): Promise<LobDocument> {
    const create_lob: Partial<LobDocument> = {
      name: data.name,
    };
    return await this.lobRepository
      .save(create_lob)
      .then((result) => {
        dbOutputTime(result);
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

  async updateMerchantLobProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const create_lob: Partial<LobDocument> = {
      name: data.name,
    };

    return this.lobRepository
      .createQueryBuilder('merchant_lob')
      .update(LobDocument)
      .set(create_lob)
      .where('id= :id', { id: data.id })
      .returning('*')
      .execute()
      .then((response) => {
        dbOutputTime(response.raw[0]);
        return response.raw[0];
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

  async deleteMerchantLobProfile(id: string): Promise<any> {
    return this.lobRepository.softDelete(id);
  }

  async listGroup(data: Record<string, any>): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    let totalItems: number;

    return await this.lobRepository
      .createQueryBuilder('merchant_lob')
      .select('*')
      .where('lower(name) like :aname', { aname: '%' + search + '%' })
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.lobRepository
          .createQueryBuilder('merchant_lob')
          .select('*')
          .where('lower(name) like :aname', { aname: '%' + search + '%' })
          .orderBy('created_at', 'DESC')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getRawMany();
      })
      .then((result) => {
        result.forEach((row) => {
          dbOutputTime(row);
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
