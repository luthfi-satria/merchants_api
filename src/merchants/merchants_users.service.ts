import {
  BadRequestException,
  forwardRef,
  HttpService,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ListResponse } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import {
  Brackets,
  FindOperator,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantUsersValidation } from './validation/merchants_users.validation';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { randomUUID } from 'crypto';
import { RoleService } from 'src/common/services/admins/role.service';
import _ from 'lodash';
import { ListMerchantUsersValidation } from './validation/list_merchants_users.validation';
import { MerchantsService } from './merchants.service';

@Injectable()
export class MerchantUsersService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantService: MerchantsService,
  ) {}

  async createMerchantUsers(
    args: Partial<MerchantUsersValidation>,
  ): Promise<Partial<MerchantUsersDocument> & MerchantUsersDocument> {
    const merchant = await this.merchantService.getAndValidateMerchantById(
      args.merchant_id,
    );

    await this.getAndValidateMerchantUserByEmail(args.email);
    await this.getAndValidateMerchantUserByPhone(args.phone);

    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      args.password,
      salt,
    );
    const createMerchantUser: Partial<MerchantUsersDocument> = {
      name: args.name,
      phone: args.phone,
      email: args.email,
      merchant_id: args.merchant_id,
      password: passwordHash,
      merchant,
    };
    try {
      const createMerchant = await this.merchantUsersRepository.save(
        createMerchantUser,
      );

      formatingAllOutputTime(createMerchant);
      removeAllFieldPassword(createMerchant);

      return createMerchant;
    } catch (err) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: err.column,
            constraint: [err.message],
          },
          'Bad Request',
        ),
      );
    }
  }

  async updateMerchantUsers(
    args: Partial<MerchantUsersValidation>,
  ): Promise<MerchantUsersDocument> {
    const usersExist: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { id: args.id, merchant_id: args.merchant_id },
        relations: ['merchant'],
      });
    if (!usersExist) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    Object.assign(usersExist, args);

    if (args.email) {
      await this.getAndValidateMerchantUserByEmail(args.email, args.id);
    }

    if (args.phone) {
      await this.getAndValidateMerchantUserByPhone(args.phone, args.id);
    }

    if (args.password) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        args.password,
        salt,
      );
      usersExist.password = passwordHash;
    }

    try {
      const resultUpdate = await this.merchantUsersRepository.save(usersExist);
      removeAllFieldPassword(resultUpdate);
      return resultUpdate;
    } catch (err) {
      console.error('catch error: ', err);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: err.column,
            constraint: [err.message],
          },
          'Bad Request',
        ),
      );
    }
  }

  async deleteMerchantUsers(user_id: string): Promise<UpdateResult> {
    const gUsersExist: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { id: user_id, merchant_id: Not(IsNull()) },
        relations: ['merchant'],
      });
    if (!gUsersExist) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user_id,
            property: 'user_id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    try {
      return await this.merchantUsersRepository.softDelete({ id: user_id });
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user_id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant_user.delete.invalid_id'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async listMerchantUsers(
    args: Partial<ListMerchantUsersValidation>,
  ): Promise<ListResponse> {
    const search = args.search || '';
    const currentPage = Number(args.page) || 1;
    const perPage = Number(args.limit) || 10;

    const query = this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('mu.group', 'merchant_group')
      .where(
        new Brackets((qb) => {
          qb.where('mu.name ilike :mname', {
            mname: '%' + search + '%',
          })
            .orWhere('mu.phone ilike :sphone', {
              sphone: '%' + search + '%',
            })
            .orWhere('mu.email like :semail', {
              semail: '%' + search + '%',
            });
        }),
      );

    if (args.merchant_id) {
      query.andWhere('mu.merchant_id = :merchant_id', {
        merchant_id: args.merchant_id,
      });
    }

    if (args.role_id) {
      query.andWhere('mu.role_id = :role_id', { role_id: args.role_id });
    }

    if (args.group_id) {
      query.andWhere('mu.group_id = :group_id', { group_id: args.group_id });
    }

    if (args.statuses) {
      query.andWhere('mu.status in (:...statuses)', {
        statuses: args.statuses,
      });
    }

    try {
      const result_merchant = await query
        .orderBy('mu.name')
        .offset((currentPage - 1) * perPage)
        .limit(perPage)
        .getManyAndCount();

      formatingAllOutputTime(result_merchant[0]);
      removeAllFieldPassword(result_merchant[0]);

      const role_ids: string[] = [];
      result_merchant[0].forEach((raw) => {
        if (raw.role_id) {
          role_ids.push(raw.role_id);
        }
      });

      const roles = await this.roleService.getRole(role_ids);

      if (roles) {
        result_merchant[0].forEach((raw) => {
          const roleName = _.find(roles, { id: raw.role_id });
          raw.role_name = roleName ? roleName.name : null;
        });
      }

      const listResult: ListResponse = {
        total_item: result_merchant[1],
        limit: perPage,
        current_page: currentPage,
        items: result_merchant[0],
      };
      return listResult;
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.http.internalServerError'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async checkExistEmailPhone(
    email: string,
    phone: string,
    id: string,
  ): Promise<any> {
    const cekemail: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { email: email },
      });
    if ((id == '' && cekemail) || (cekemail && cekemail.id != id)) {
      if (cekemail) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: email,
              property: 'email',
              constraint: [
                this.messageService.get('merchant.general.emailExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }
    const cekphone: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { phone: phone },
      });

    if ((id == '' && cekphone) || (cekphone && cekphone.id != id)) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: phone,
            property: 'phone',
            constraint: [
              this.messageService.get('merchant.general.phoneExist'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    return true;
  }

  async createMerchantUsersFromMerchant(
    args: Partial<MerchantUsersDocument>,
  ): Promise<any> {
    args.token_reset_password = randomUUID();

    const result: Record<string, any> = await this.merchantUsersRepository.save(
      args,
    );

    if (process.env.NODE_ENV == 'test') {
      const url = `${process.env.BASEURL_HERMES}/auth/create-password?t=${result.token_reset_password}`;
      result.url_reset_password = url;
    }
    return result;
  }

  async updateMerchantUsersFromMerchant(
    args: Partial<MerchantUsersDocument>,
  ): Promise<any> {
    const result = await this.merchantUsersRepository.save(args);
    delete result.password;
    return result;
  }

  async getAndValidateMerchantUserByPhone(
    phone: string,
    id?: string,
  ): Promise<MerchantUsersDocument> {
    const where: { phone: string; id?: FindOperator<string> } = { phone };
    if (id) {
      where.id = Not(id);
    }

    const cekphone: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where,
      });

    if (cekphone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: phone,
            property: 'phone',
            constraint: [
              this.messageService.get('merchant.general.phoneExist'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return cekphone;
  }

  async getAndValidateMerchantUserByEmail(
    email: string,
    id?: string,
  ): Promise<MerchantUsersDocument> {
    const where: { email: string; id?: FindOperator<string> } = { email };
    if (id) {
      where.id = Not(id);
    }
    const cekemail: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where,
      });

    if (cekemail) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: email,
            property: 'email',
            constraint: [
              this.messageService.get('merchant.general.emailExist'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return cekemail;
  }
  //------------------------------------------------------------------------------

  async getHttp(
    url: string,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.get(url, { headers: headers }).pipe(
      map((response: any) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
