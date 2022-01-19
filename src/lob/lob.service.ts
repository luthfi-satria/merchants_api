import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { LobDocument, LobStatus } from 'src/database/entities/lob.entity';
import { dbOutputTime } from 'src/utils/general-utils';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import {
  MerchantLobValidation,
  UpdateLobValidation,
} from './validation/lob.validation';

@Injectable()
export class LobService {
  constructor(
    @InjectRepository(LobDocument)
    private readonly lobRepository: Repository<LobDocument>,
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  async findLobById(id: string): Promise<LobDocument> {
    return this.lobRepository.findOne({ id: id });
  }

  async findLobByName(name: string): Promise<LobDocument> {
    return this.lobRepository.findOne({ where: { name: name } });
  }

  async createMerchantLobProfile(
    data: MerchantLobValidation,
  ): Promise<LobDocument> {
    const create_lob: Partial<LobDocument> = {
      name: data.name,
      status: data.status ? data.status : LobStatus.ACTIVE,
    };
    return this.lobRepository
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
    data: UpdateLobValidation,
    lob: LobDocument,
  ): Promise<LobDocument> {
    lob.name = data.name ? data.name : lob.name;
    lob.status = data.status ? data.status : lob.status;
    return this.lobRepository.save(lob);
  }

  async deleteMerchantLobProfile(id: string): Promise<any> {
    return this.lobRepository.softDelete(id);
  }

  async listGroup(data: Record<string, any>): Promise<Record<string, any>> {
    const search = data.search || '';
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;

    const lob = this.lobRepository
      .createQueryBuilder('')
      .where('name ilike :aname', { aname: '%' + search + '%' });
    if (data.status) {
      lob.andWhere('status = :stat', { stat: data.status });
    }
    lob
      .orderBy('created_at', 'DESC')
      .skip((currentPage - 1) * perPage)
      .take(perPage);

    const result = await lob.getManyAndCount();

    result[0].forEach((row) => {
      dbOutputTime(row);
    });

    const list_result: ListResponse = {
      total_item: result[1],
      limit: Number(perPage),
      current_page: Number(currentPage),
      items: result[0],
    };
    return list_result;
  }

  async viewDetailGroup(lob_id: string): Promise<LobDocument> {
    return this.lobRepository
      .findOne(lob_id)
      .then((result) => {
        dbOutputTime(result);

        return result;
      })
      .catch(() => {
        const errors: RMessage = {
          value: lob_id,
          property: 'lob_id',
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
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
