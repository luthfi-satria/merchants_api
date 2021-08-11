import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GroupDocument } from 'src/database/entities/group.entity';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { createUrl, dbOutputTime } from 'src/utils/general-utils';
import { MerchantsService } from 'src/merchants/merchants.service';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly merchantService: MerchantsService,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async findMerchantById(id: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ id: id });
  }

  async findMerchantByPhone(phone: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({ where: { phone: phone } });
  }

  async findMerchantByEmail(email: string): Promise<GroupDocument> {
    return await this.groupRepository.findOne({
      where: { email: email },
    });
  }

  async createMerchantGroupProfile(
    data: Record<string, any>,
  ): Promise<GroupDocument> {
    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      data.owner_password,
      salt,
    );
    const create_group: Partial<GroupDocument> = {
      name: data.name,
      owner_name: data.owner_name,
      owner_password: passwordHash,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };
    if (
      data.status != null &&
      data.status != '' &&
      typeof data.status != 'undefined'
    )
      create_group.status = data.status;
    if (
      data.owner_ktp != null &&
      data.owner_ktp != '' &&
      typeof data.owner_ktp != 'undefined'
    )
      create_group.owner_ktp = data.owner_ktp;
    return await this.groupRepository
      .save(create_group)
      .then(async (result) => {
        result.owner_ktp = createUrl(result.owner_ktp);
        dbOutputTime(result);
        // const cekMerchantUser = await this.merchantUsersRepository.findOne({
        //   where: { email: data.email, phone: data.phone },
        // });
        const mUsers: Partial<MerchantUsersDocument> = {
          name: result.owner_name,
          email: result.email,
          phone: result.phone,
          password: result.owner_password,
          group_id: result.id,
        };
        await this.merchantUsersRepository.save(mUsers);
        delete result.owner_password;
        return result;
      })
      .catch((err2) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: err2.column,
              constraint: [err2.message],
            },
            'Bad Request',
          ),
        );
      });
  }

  async updateMerchantGroupProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const updateMUsers: Partial<MerchantUsersDocument> = {};
    const create_group: Partial<GroupDocument> = {};

    if (typeof data.name != 'undefined' && data.name != null && data.name != '')
      create_group.name = data.name;
    if (
      typeof data.status != 'undefined' &&
      data.status != null &&
      data.status != ''
    )
      create_group.status = data.status;
    if (data.status == 'ACTIVE') {
      create_group.approved_at = new Date();
    }
    if (
      typeof data.owner_name != 'undefined' &&
      data.owner_name != null &&
      data.owner_name != ''
    ) {
      create_group.owner_name = data.owner_name;
      updateMUsers.name = data.owner_name;
    }
    if (
      typeof data.owner_password != 'undefined' &&
      data.owner_password != null &&
      data.owner_password != ''
    ) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        data.owner_password,
        salt,
      );
      data.owner_password = passwordHash;
      updateMUsers.password = passwordHash;
    }
    if (
      typeof data.owner_ktp != 'undefined' &&
      data.owner_ktp != null &&
      data.owner_ktp != ''
    )
      create_group.owner_ktp = data.owner_ktp;
    if (
      typeof data.email != 'undefined' &&
      data.email != null &&
      data.email != ''
    ) {
      create_group.email = data.email;
      updateMUsers.email = data.email;
    }
    if (
      typeof data.phone != 'undefined' &&
      data.phone != null &&
      data.phone != ''
    ) {
      create_group.phone = data.phone;
      updateMUsers.phone = data.phone;
    }
    if (
      typeof data.address != 'undefined' &&
      data.address != null &&
      data.address != ''
    )
      create_group.address = data.address;

    return this.groupRepository
      .createQueryBuilder('merchant_group')
      .update(GroupDocument)
      .set(create_group)
      .where('id= :id', { id: data.id })
      .returning('*')
      .execute()
      .then(async (response) => {
        response.raw[0].owner_ktp = createUrl(response.raw[0].owner_ktp);
        dbOutputTime(response.raw[0]);
        await this.merchantUsersRepository
          .createQueryBuilder('merchant_users')
          .update(MerchantUsersDocument)
          .set(updateMUsers)
          .where('group_id= :gid', { gid: data.id })
          .execute();
        delete response.raw[0].owner_password;
        return response.raw[0];
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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

  async deleteMerchantGroupProfile(data: string): Promise<any> {
    const cekid = await this.merchantService.findMerchantById(data);
    if (cekid) {
      if (cekid.status == 'ACTIVE') {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.deletegroup.merchant_active'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }
    return this.groupRepository
      .delete({
        id: data,
      })
      .then(() => {
        return this.merchantUsersRepository.delete({ group_id: data });
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.deletegroup.invalid_id'),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }

  async listGroup(data: Record<string, any>): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    let totalItems: number;

    return await this.groupRepository
      .createQueryBuilder()
      .select('*')
      .where('lower(name) like :name', { name: '%' + search + '%' })
      .orWhere('lower(owner_name) like :oname', {
        oname: '%' + search + '%',
      })
      .orWhere('lower(email) like :email', {
        email: '%' + search + '%',
      })
      .orWhere('lower(phone) like :ghp', {
        ghp: '%' + search + '%',
      })
      .orWhere('lower(address) like :adg', {
        adg: '%' + search + '%',
      })
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.groupRepository
          .createQueryBuilder('merchant_group')
          .select('*')
          .where('lower(name) like :name', { name: '%' + search + '%' })
          .orWhere('lower(owner_name) like :oname', {
            oname: '%' + search + '%',
          })
          .orWhere('lower(email) like :email', {
            email: '%' + search + '%',
          })
          .orWhere('lower(phone) like :ghp', {
            ghp: '%' + search + '%',
          })
          .orWhere('lower(address) like :adg', {
            adg: '%' + search + '%',
          })
          .orderBy('created_at', 'DESC')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getRawMany();
      })
      .then((result) => {
        result.forEach((row) => {
          row.owner_ktp = createUrl(row.owner_ktp);
          dbOutputTime(row);
          delete row.owner_password;
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
