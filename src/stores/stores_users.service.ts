import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  dbOutputTime,
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { Brackets, FindOperator, Not, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
// import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantStoreUsersValidation } from './validation/store_users.validation';
import { CommonService } from 'src/common/common.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { ListMerchantStoreUsersValidation } from './validation/list_store_users.validation';
import { UpdateMerchantStoreUsersValidation } from './validation/update_store_users.validation';
import {
  RoleService,
  SpecialRoleCodes,
} from 'src/common/services/admins/role.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { randomUUID } from 'crypto';
import { UpdatePhoneStoreUsersValidation } from './validation/update_phone_store_users.validation';
import { UpdateEmailStoreUsersValidation } from './validation/update_email_store_users.validation';
import { StoresService } from './stores.service';
import { RoleDTO } from 'src/common/services/admins/dto/role.dto';
import { User } from 'src/auth/guard/interface/user.interface';
import { CommonStoresService } from 'src/common/own/stores.service';
import { ListMerchantStoreUsersBySpecialRoleCodeValidation } from './validation/list_store_users_by_special_role_code.validation';

@Injectable()
export class StoreUsersService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    private commonService: CommonService,
    private roleService: RoleService,
    private readonly merchantService: MerchantsService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => StoresService))
    private readonly storeService: StoresService,
    private readonly commonStoreService: CommonStoresService,
  ) {}

  async createStoreUsers(
    args: MerchantStoreUsersValidation,
  ): Promise<RSuccessMessage> {
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

    const role = await this.roleService.getRoleAndValidatePlatformByRoleId(
      args.role_id,
      'HERMES_STORE',
    );

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
      const result: Record<string, any> =
        await this.merchantUsersRepository.save(createMerchantUser);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;

      if (process.env.NODE_ENV == 'test') {
        result.url = urlVerification;
      }

      this.notificationService.sendSms(
        createMerchantUser.phone,
        urlVerification,
      );

      dbOutputTime(result);
      dbOutputTime(result.store);
      delete result.password;
      result.role_name = role.name;

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
    user: any,
  ) {
    const store_user = await this.getAndValidateStoreUserById(userId, user);

    await this.getAndValidateStoreUserByPhone(args.phone, userId);
    store_user.phone = args.phone;

    try {
      const result = await this.merchantUsersRepository.save(store_user);
      dbOutputTime(result);
      dbOutputTime(result.store);
      delete result.password;

      this.notificationService.sendSms(
        store_user.phone,
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

  async updateEmailStoreUsers(
    userId: string,
    args: UpdateEmailStoreUsersValidation,
    user: any,
  ) {
    const storeUser = await this.getAndValidateStoreUserById(userId, user);

    await this.getAndValidateStoreUserByEmail(args.email, userId);
    storeUser.email = args.email;

    try {
      const result = await this.merchantUsersRepository.save(storeUser);
      dbOutputTime(result);
      dbOutputTime(result.store);
      delete result.password;

      this.notificationService.sendEmail(
        storeUser.email,
        'Email Anda telah aktif',
        'Alamat email Anda telah digunakan sebagai login baru',
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

  async updatePasswordStoreUsers(userId: string, user?: any) {
    const storeUser = await this.getAndValidateStoreUserById(userId, user);

    const token = randomUUID();
    storeUser.token_reset_password = token;

    try {
      const result = await this.merchantUsersRepository.save(storeUser);
      dbOutputTime(result);
      dbOutputTime(result.store);
      delete result.password;

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      this.notificationService.sendSms(storeUser.phone, urlVerification);

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
    user?: any,
  ): Promise<MerchantUsersDocument> {
    const gUsersExist = await this.getAndValidateStoreUserById(args.id, user);
    if (gUsersExist.store_id != args.store_id) {
      gUsersExist.store = await this.storeService.getAndValidateStoreByStoreId(
        args.store_id,
      );
    }
    if (args.phone) {
      await this.getAndValidateStoreUserByPhone(args.phone, args.id);
    }
    if (args.email) {
      await this.getAndValidateStoreUserByEmail(args.email, args.id);
    }

    let role: RoleDTO;
    if (args.role_id) {
      role = await this.roleService.getRoleAndValidatePlatformByRoleId(
        args.role_id,
        'HERMES_STORE',
      );
    }
    Object.assign(gUsersExist, args);
    if (args.password) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        args.password,
        salt,
      );
      gUsersExist.password = passwordHash;
    }

    return this.merchantUsersRepository
      .save(gUsersExist)
      .then(async (result) => {
        formatingAllOutputTime(result);
        removeAllFieldPassword(result);
        result.role_name = role.name;

        return result;
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

    const query = this.merchantUsersRepository.createQueryBuilder('mu');

    query
      .leftJoinAndSelect('mu.group', 'merchant_group')
      // get data group in merchant
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
      // get data group in store
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('merchant_store.merchant', 'merchant_store_merchant')
      .leftJoinAndSelect(
        'merchant_store_merchant.group',
        'merchant_store_merchant_group',
      )
      // get store category
      .leftJoinAndSelect(
        'merchant_store.store_categories',
        'merchant_store_categories',
      )
      .leftJoinAndSelect(
        'merchant_store_categories.languages',
        'merchant_store_categories_languages',
        'merchant_store_categories_languages.lang = :lid',
        { lid: 'id' },
      )
      .where('mu.store_id is not null')
      .andWhere(
        new Brackets((qb) => {
          qb.where('mu.name ilike :mname', {
            mname: '%' + search + '%',
          })
            .orWhere('mu.nip like :mnip', {
              mnip: '%' + search + '%',
            })
            .orWhere('merchant_store_merchant_group.name ilike :gname', {
              gname: '%' + search + '%',
            })
            .orWhere('merchant_store_merchant.name ilike :mmname', {
              mmname: '%' + search + '%',
            })
            .orWhere('merchant_store.name ilike :msname', {
              msname: '%' + search + '%',
            });
        }),
      );

    if (statuses.length > 0) {
      query.andWhere('mu.status in (:...gstat)', {
        gstat: statuses,
      });
    }

    if (args.role_id) {
      query.andWhere('mu.role_id = :role_id', {
        role_id: args.role_id,
      });
    }

    if (args.store_id) {
      query.andWhere('mu.store_id = :store_id', {
        store_id: args.store_id,
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
      query.andWhere('merchant_store.merchant_id = :mid', {
        mid: user.merchant_id,
      });
    } else if (user.level == 'group') {
      query.andWhere('merchant_store_merchant.group_id = :group_id', {
        group_id: user.group_id,
      });
    }

    return query
      .orderBy('mu.name')
      .skip((currentPage - 1) * perPage)
      .take(perPage)
      .getManyAndCount()
      .then(async (result) => {
        totalItems = result[1];
        result[0].forEach((raw: Record<string, any>) => {
          if (raw.merchant) {
            delete raw.merchant.pic_password;
          }
          if (raw.group) {
            delete raw.group.director_password;
            delete raw.group.pic_operational_password;
            delete raw.group.pic_finance_password;
          }
          if (raw.store) {
            raw.store.store_categories.forEach(
              (element: Record<string, any>) => {
                element.name = element.languages[0].name;
                delete element.languages;
              },
            );
            raw.store_categories = raw.store.store_categories;
            delete raw.store.store_categories;
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
        console.error(err);
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

  async detailStoreUsers(
    user_id: string,
    user?: any,
  ): Promise<MerchantUsersDocument> {
    try {
      const query = this.merchantUsersRepository
        .createQueryBuilder('mu')
        .leftJoinAndSelect('mu.group', 'merchant_group')
        // get data group in merchant
        .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
        .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
        // get data group in store
        .leftJoinAndSelect('mu.store', 'merchant_store')
        .leftJoinAndSelect('merchant_store.merchant', 'merchant_store_merchant')
        .leftJoinAndSelect(
          'merchant_store_merchant.group',
          'merchant_store_merchant_group',
        )
        .where('mu.id = :user_id', { user_id })
        .andWhere('mu.store_id is not null');

      if (user.level == 'merchant') {
        query.andWhere('merchant_store.merchant_id = :mid', {
          mid: user.merchant_id,
        });
      } else if (user.level == 'group') {
        query.andWhere('merchant_store_merchant.group_id = :group_id', {
          group_id: user.group_id,
        });
      }
      const store_user = await query.getOne();
      if (!store_user) {
        return null;
      }

      const roles = await this.roleService.getRole([store_user.role_id]);
      if (roles) {
        this.parseRoleDetails([store_user], roles);
      }

      removeAllFieldPassword(store_user);
      formatingAllOutputTime(store_user);

      return store_user;
    } catch (error) {
      Logger.error(error);
    }
  }

  async listStoreUsersBySpecialRoleCode(
    storeId: string,
    specialRoleCode: SpecialRoleCodes,
    query: ListMerchantStoreUsersBySpecialRoleCodeValidation,
    user: User,
  ): Promise<MerchantUsersDocument[]> {
    await this.commonStoreService.getAndValidateStoreByStoreIds(
      [storeId],
      user,
    );

    const specialRole = await this.roleService.getSpecialRoleByCode(
      specialRoleCode,
    );

    const role = specialRole.role;
    role.special_role = specialRole;
    delete role.special_role.role;

    const param: ListMerchantStoreUsersValidation = {
      ...query,
      role_id: role.id,
      id: null,
      name: null,
      nip: null,
      email: null,
      phone: null,
      password: null,
      store_id: storeId,
      merchant_id: null,
      group_id: null,
    };

    const listUser = await this.listStoreUsers(param, user);
    listUser.data.items.map((user) => {
      user.role = role;
      return user;
    });
    return listUser.data;
  }

  async getAndValidateStoreUserById(
    user_id: string,
    user?: any,
  ): Promise<MerchantUsersDocument> {
    const query = this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.group', 'merchant_group')
      // get data group in merchant
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
      // get data group in store
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('merchant_store.merchant', 'merchant_store_merchant')
      .leftJoinAndSelect(
        'merchant_store_merchant.group',
        'merchant_store_merchant_group',
      )
      .where('mu.id = :user_id', { user_id })
      .andWhere('mu.store_id is not null');

    if (user && user.level == 'merchant') {
      query.andWhere('merchant_store.merchant_id = :mid', {
        mid: user.merchant_id,
      });
    } else if (user && user.level == 'group') {
      query.andWhere('merchant_store_merchant.group_id = :group_id', {
        group_id: user.group_id,
      });
    }
    const store_user = await query.getOne();
    if (!store_user) {
      const errors: RMessage = {
        value: user_id,
        property: 'store_user_id',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return store_user;
  }

  async getAndValidateStoreUserByPhone(
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

  async getAndValidateStoreUserByEmail(
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

  parseRoleDetails(
    exist: MerchantUsersDocument[],
    role_detail: Record<string, any>[],
  ): MerchantUsersDocument[] {
    try {
      return exist.map((row) => {
        const role_name = role_detail.find((item) => item.id == row.role_id);
        return new MerchantUsersDocument({
          ...row,
          role_name: role_name ? role_name.name : null,
        });
      });
    } catch (error) {
      Logger.error(error);
    }
  }

  async resendEmailUser(user_id: string): Promise<RSuccessMessage> {
    const userAccount = await this.merchantUsersRepository.findOne(user_id);
    if (!userAccount) {
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
    userAccount.email_verified_at = null;
    const token = randomUUID();
    userAccount.token_reset_password = token;

    try {
      const result: Record<string, any> =
        await this.merchantUsersRepository.save(userAccount);
      removeAllFieldPassword(result);
      formatingAllOutputTime(result);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/email-verification?t=${token}`;
      if (process.env.NODE_ENV == 'test') {
        result.token_reset_password = token;
        result.url = urlVerification;
      }
      this.notificationService.sendEmail(
        userAccount.email,
        'Verifikasi Ulang Email',
        urlVerification,
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

  async resendPhoneUser(user_id: string): Promise<RSuccessMessage> {
    const userAccount = await this.merchantUsersRepository.findOne(user_id);
    if (!userAccount) {
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
    userAccount.phone_verified_at = null;
    const token = randomUUID();
    userAccount.token_reset_password = token;

    try {
      const result: Record<string, any> =
        await this.merchantUsersRepository.save(userAccount);
      removeAllFieldPassword(result);
      formatingAllOutputTime(result);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;
      if (process.env.NODE_ENV == 'test') {
        result.token_reset_password = token;
        result.url = urlVerification;
      }
      this.notificationService.sendSms(userAccount.phone, urlVerification);

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
