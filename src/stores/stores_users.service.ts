import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime, deleteCredParam } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantStoreUsersValidation } from './validation/store_users.validation';
import { CommonService } from 'src/common/common.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { ListMerchantStoreUsersValidation } from './validation/list_store_users.validation';
import { UpdateMerchantStoreUsersValidation } from './validation/update_store_users.validation';
import { RoleService } from 'src/common/services/admins/role.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { randomUUID } from 'crypto';
import { UpdatePhoneStoreUsersValidation } from './validation/update_phone_store_users.validation';

@Injectable()
export class StoreUsersService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    private commonService: CommonService,
    private roleService: RoleService,
    private readonly merchantService: MerchantsService,
    private readonly notificationService: NotificationService,
  ) {}

  async createStoreUsers(
    args: MerchantStoreUsersValidation,
  ): Promise<RSuccessMessage> {
    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/roles/${args.role_id}`;
    const role = await this.commonService.getHttp(url);
    if (!role || (role && !role.data)) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.role_id,
            property: 'role_id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const cekStoreId = await this.storeRepository
      .findOne({
        id: args.store_id,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.store_id,
              property: 'store_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!cekStoreId) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.store_id,
            property: 'store_id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    const cekemail: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { email: args.email },
      });

    if (cekemail) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [
              this.messageService.get('merchant.general.emailExist'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    const cekphone: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { phone: args.phone },
      });

    if (cekphone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [
              this.messageService.get('merchant.general.phoneExist'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      args.password,
      salt,
    );
    const createMerchantUser: Partial<MerchantUsersDocument> = {
      name: args.name,
      nip: args.nip,
      phone: args.phone,
      email: args.email,
      store_id: args.store_id,
      password: passwordHash,
      store: cekStoreId,
      role_id: args.role_id,
      status: args.status,
    };

    const token = randomUUID();
    createMerchantUser.token_reset_password = token;

    try {
      const result = await this.merchantUsersRepository.save(
        createMerchantUser,
      );

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      this.notificationService.sendSms(
        createMerchantUser.phone,
        urlVerification,
      );

      dbOutputTime(result);
      dbOutputTime(result.store);
      delete result.password;

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
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

  async updatePhoneStoreUsers(
    userId: string,
    args: UpdatePhoneStoreUsersValidation,
  ) {
    const user: MerchantUsersDocument =
      await this.merchantUsersRepository.findOne({
        where: { id: userId },
        relations: ['store'],
      });

    if (!user) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: userId,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    if (args.phone) {
      const cekphone: MerchantUsersDocument =
        await this.merchantUsersRepository.findOne({
          where: { phone: args.phone },
        });

      if (cekphone && cekphone.id != userId) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('merchant.general.phoneExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      user.phone = args.phone;
    }

    try {
      const result = await this.merchantUsersRepository.save(user);
      dbOutputTime(result);
      dbOutputTime(result.store);
      delete result.password;

      this.notificationService.sendSms(
        user.phone,
        'Nomor Anda telah digunakan sebagai login baru',
      );

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
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

  async updateStoreUsers(
    args: UpdateMerchantStoreUsersValidation,
  ): Promise<RSuccessMessage> {
    if (args.role_id) {
      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/roles/${args.role_id}`;
      const role = await this.commonService.getHttp(url);
      if (!role || (role && !role.data)) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.role_id,
              property: 'role_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }
    const gUsersExist: MerchantUsersDocument =
      await this.merchantUsersRepository
        .findOne({
          where: { id: args.id, store_id: args.store_id },
          relations: ['store'],
        })
        .catch(() => {
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
        });
    if (!gUsersExist) {
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
    gUsersExist.role_id = args.role_id;
    if (args.name) gUsersExist.name = args.name;
    if (args.phone) {
      const cekphone: MerchantUsersDocument =
        await this.merchantUsersRepository.findOne({
          where: { phone: args.phone },
        });

      if (cekphone && cekphone.id != args.id) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('merchant.general.phoneExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      gUsersExist.phone = args.phone;
    }
    if (args.email) {
      const cekemail: MerchantUsersDocument =
        await this.merchantUsersRepository.findOne({
          where: { email: args.email },
        });

      if (cekemail && cekemail.id != args.id) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.email,
              property: 'email',
              constraint: [
                this.messageService.get('merchant.general.emailExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      gUsersExist.email = args.email;
    }
    if (args.password) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        args.password,
        salt,
      );
      gUsersExist.password = passwordHash;
    }
    if (args.nip) gUsersExist.nip = args.nip;
    if (args.status) gUsersExist.status = args.status;

    return this.merchantUsersRepository
      .save(gUsersExist)
      .then(async (result) => {
        dbOutputTime(result);
        dbOutputTime(result.store);
        delete result.password;

        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          result,
        );
      })
      .catch((err) => {
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
      });
  }

  async deleteStoreUsers(
    args: Partial<MerchantStoreUsersValidation>,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    const gUsersExist: MerchantUsersDocument =
      await this.merchantUsersRepository
        .findOne({
          where: { id: args.id },
          relations: ['store'],
        })
        .catch(() => {
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
        });
    if (!gUsersExist) {
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

    if (user.user_type == 'merchant' && user.level == 'merchant') {
      if (user.merchant_id != gUsersExist.store.merchant_id) {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: user.merchant_id,
              property: 'merchant_id',
              constraint: [
                this.messageService.get('merchant.general.unauthorizedUser'),
              ],
            },
            'Unauthorized',
          ),
        );
      }
    }

    if (user.user_type == 'merchant' && user.level == 'group') {
      const cekGroup = await this.merchantService.findMerchantById(
        gUsersExist.store.merchant_id,
      );
      if (!cekGroup) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: user.group_id,
              property: 'group_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      if (user.group_id != cekGroup.group_id) {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: user.group_id,
              property: 'group_id',
              constraint: [
                this.messageService.get('merchant.general.unauthorizedUser'),
              ],
            },
            'Unauthorized',
          ),
        );
      }
    }
    return this.merchantUsersRepository
      .softDelete({ id: args.id })
      .then(async () => {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
        );
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.general.invalidID'),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }

  async listStoreUsers(
    args: ListMerchantStoreUsersValidation,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    const search = args.search || '';
    const currentPage = args.page || 1;
    const perPage = args.limit || 10;
    let totalItems: number;
    const statuses = args.statuses || [];

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

    if (statuses.length > 0) {
      query.andWhere('mu.status in (:...gstat)', {
        gstat: statuses,
      });
    }

    if (args.role_id) {
      query.andWhere('mu.role_id = :sid', {
        sid: args.role_id,
      });
    }

    if (args.store_id) {
      query.andWhere('mu.store_id = :sid', {
        sid: args.store_id,
      });
    }

    if (
      (user.user_type == 'admin' || user.level == 'group') &&
      args.merchant_id
    ) {
      query.andWhere('mu.merchant_id = :mid', {
        mid: args.merchant_id,
      });
    }

    if (user.user_type == 'admin' && args.group_id) {
      query.andWhere('mu.group_id = :gid', {
        gid: args.group_id,
      });
    }

    if (user.level == 'merchant') {
      query.andWhere('mu.merchant_id = :mid', {
        mid: user.merchant_id,
      });
    } else if (user.level == 'group') {
      query.andWhere('mu.group_id = :group_id', {
        group_id: user.group_id,
      });
    }

    return query
      .orderBy('mu.name')
      .offset((currentPage - 1) * perPage)
      .limit(perPage)
      .getManyAndCount()
      .then(async (result) => {
        totalItems = result[1];
        result[0].forEach((raw) => {
          if (raw.merchant) {
            delete raw.merchant.pic_password;
          }
          if (raw.group) {
            delete raw.group.director_password;
            delete raw.group.pic_operational_password;
            delete raw.group.pic_finance_password;
          }
          delete raw.password;
          raw.role_name = raw.role_id || '';
        });

        const listResult: ListResponse = {
          total_item: totalItems,
          limit: perPage,
          current_page: currentPage,
          items: result[0],
        };
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          listResult,
        );
      })
      .catch((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.id,
              property: 'id',
              constraint: [
                this.messageService.getjson({
                  code: 'DATA_NOT_FOUND',
                  message: err.message,
                }),
              ],
            },
            'Bad Request',
          ),
        );
      });
  }

  async detailStoreUsers(user_id: string): Promise<MerchantUsersDocument> {
    const store_user = await this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('mu.group', 'merchant_group')
      .where('mu.id = :user_id', { user_id })
      .andWhere('mu.store_id is not null')
      .getOne();
    if (!store_user) {
      return null;
    }

    const roles = await this.roleService.getRole([store_user.role_id]);
    if (roles) {
      store_user.role_name = roles[0].name;
    }

    deleteCredParam(store_user);
    deleteCredParam(store_user.store);
    delete store_user.token_reset_password;
    delete store_user.email_verified_at;
    delete store_user.phone_verified_at;

    if (store_user.merchant) {
      deleteCredParam(store_user.merchant);
    }
    if (store_user.group) {
      deleteCredParam(store_user.group);
    }

    return store_user;
  }

  parseRoleDetails(
    exist: MerchantUsersDocument[],
    role_detail: Record<string, any>[],
  ): MerchantUsersDocument[] {
    try {
      return exist.map((row) => {
        const role_name = role_detail.find((item) => item.id == row.role_id);
        return new MerchantUsersDocument({
          ...row,
          role_name: role_name ? role_name.name : '#undefined',
        });
      });
    } catch (error) {
      Logger.error(error);
    }
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
