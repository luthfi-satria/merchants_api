import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { isDefined } from 'class-validator';
import { randomUUID } from 'crypto';
import { catchError, map, Observable } from 'rxjs';
import { User } from 'src/auth/guard/interface/user.interface';
import { CommonService } from 'src/common/common.service';
import { NotificationService } from 'src/common/notification/notification.service';
import { CommonStoresService } from 'src/common/own/stores.service';
import { RoleDTO } from 'src/common/services/admins/dto/role.dto';
import {
  RoleService,
  SpecialRoleCodes,
} from 'src/common/services/admins/role.service';
// import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { GroupsService } from 'src/groups/groups.service';
import { HashService } from 'src/hash/hash.service';
import { MerchantsService } from 'src/merchants/merchants.service';
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
  generateMessageChangeActiveEmail,
  generateMessageUrlVerification,
  generateSmsResetPassword,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { Brackets, FindOperator, Not, Repository } from 'typeorm';
import {
  generateSmsChangeActiveNoHp,
  generateSmsUrlVerification,
} from './../utils/general-utils';
import { StoresService } from './stores.service';
import { ListMerchantStoreUsersValidation } from './validation/list_store_users.validation';
import { ListMerchantStoreUsersBySpecialRoleCodeValidation } from './validation/list_store_users_by_special_role_code.validation';
import { MerchantStoreUsersValidation } from './validation/store_users.validation';
import { UpdateEmailStoreUsersValidation } from './validation/update_email_store_users.validation';
import { UpdatePhoneStoreUsersValidation } from './validation/update_phone_store_users.validation';
import { UpdateMerchantStoreUsersValidation } from './validation/update_store_users.validation';

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
    private readonly groupService: GroupsService,
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
      //Cheking Env Bypass Verification
      const bypassEnv = process.env.HERMES_USER_REGISTER_BYPASS;
      const bypassUser = bypassEnv && bypassEnv == 'true' ? true : false;
      if (bypassUser) {
        createMerchantUser.email_verified_at = new Date();
        createMerchantUser.phone_verified_at = new Date();
      }

      const result: Record<string, any> =
        await this.merchantUsersRepository.save(createMerchantUser);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;

      if (process.env.NODE_ENV == 'test') {
        result.url = urlVerification;
      }

      if (!bypassUser) {
        const smsMessage = await generateSmsUrlVerification(
          createMerchantUser.name,
          urlVerification,
        );

        this.notificationService.sendSms(createMerchantUser.phone, smsMessage);
      }

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

      const smsMessage = generateSmsChangeActiveNoHp(store_user.name);

      this.notificationService.sendSms(store_user.phone, smsMessage);

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

      if (result.email_verified_at) {
        const messageChangeActiveEmail = generateMessageChangeActiveEmail(
          storeUser.name,
        );
        this.notificationService.sendEmail(
          storeUser.email,
          'Email Anda telah aktif',
          '',
          messageChangeActiveEmail,
        );
      } else {
        this.sendNewEmailUser(userId);
      }

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

      const smsMessage = await generateSmsResetPassword(
        storeUser.name,
        urlVerification,
      );

      this.notificationService.sendSms(storeUser.phone, smsMessage);

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
    if (args.id == user.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.id,
            property: 'user_id',
            constraint: [
              this.messageService.get('merchant_user.delete.self_delete'),
            ],
          },
          'Bad Request',
        ),
      );
    }

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
        result[0].forEach(async (raw: Record<string, any>) => {
          if (raw.merchant) {
            await this.merchantService.manipulateMerchantUrl(raw.merchant);
            await this.groupService.manipulateGroupUrl(raw.merchant.group);
            delete raw.merchant.pic_password;
          }
          if (raw.group) {
            delete raw.group.director_password;
            delete raw.group.pic_operational_password;
            delete raw.group.pic_finance_password;
            await this.groupService.manipulateGroupUrl(raw.group);
          }
          if (raw.store) {
            raw.store.store_categories.forEach(
              (element: Record<string, any>) => {
                element.name = element.languages[0].name;
                delete element.languages;
                if (
                  isDefined(element.image) &&
                  element.image &&
                  !element.image.includes('dummyimage')
                ) {
                  const fileName =
                    element.image.split('/')[
                      element.image.split('/').length - 1
                    ];
                  element.image = `${process.env.BASEURL_API}/api/v1/merchants/store/categories/${element.id}/image/${fileName}`;
                }
              },
            );
            raw.store_categories = raw.store.store_categories;
            delete raw.store.store_categories;
            await this.storeService.manipulateStoreUrl(raw.store);
            await this.merchantService.manipulateMerchantUrl(
              raw.store.merchant,
            );
            await this.groupService.manipulateGroupUrl(
              raw.store.merchant.group,
            );
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

      if (store_user.merchant) {
        await this.merchantService.manipulateMerchantUrl(store_user.merchant);
        await this.groupService.manipulateGroupUrl(store_user.merchant.group);
        delete store_user.merchant.pic_password;
      }
      if (store_user.group) {
        delete store_user.group.director_password;
        delete store_user.group.pic_operational_password;
        delete store_user.group.pic_finance_password;
        await this.groupService.manipulateGroupUrl(store_user.group);
      }
      if (store_user.store) {
        await this.storeService.manipulateStoreUrl(store_user.store);
        await this.merchantService.manipulateMerchantUrl(
          store_user.store.merchant,
        );
        await this.groupService.manipulateGroupUrl(
          store_user.store.merchant.group,
        );
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
    try {
      await this.commonStoreService
        .getAndValidateStoreByStoreIds([storeId], user)
        .catch(() => {
          const errors: RMessage = {
            value: storeId,
            property: 'store_id',
            constraint: [
              this.messageService.get(
                'merchant_user.general.validation_store_failed',
              ),
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

      const specialRole = await this.roleService
        .getSpecialRoleByCode(specialRoleCode)
        .catch(() => {
          const errors: RMessage = {
            value: specialRoleCode,
            property: 'special_role_code',
            constraint: [
              this.messageService.get(
                'merchant_user.general.fetch_special_role_code_failed',
              ),
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

      const listUser = await this.listStoreUsers(param, user).catch(() => {
        const errors: RMessage = {
          value: JSON.stringify(param, null, 4),
          property: 'query',
          constraint: [
            this.messageService.get(
              'merchant_user.general.fetch_store_users_failed',
            ),
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
      listUser.data.items.map((user) => {
        user.role = role;
        return user;
      });
      return listUser.data;
    } catch (error) {
      console.error(error);
      if (error.message == 'Bad Request Exception') {
        throw error;
      } else {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [
            this.messageService.get('merchant_user.general.list_failed'),
            error.message,
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
    }
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

  async sendNewEmailUser(user_id: string): Promise<RSuccessMessage> {
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
      const messageUrlVerifivation = await generateMessageUrlVerification(
        userAccount.name,
        urlVerification,
      );
      if (process.env.NODE_ENV == 'test') {
        result.token_reset_password = token;
        result.url = urlVerification;
      }
      this.notificationService.sendEmail(
        userAccount.email,
        'Verifikasi Email baru',
        '',
        messageUrlVerifivation,
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
      const messageUrlVerifivation = await generateMessageUrlVerification(
        userAccount.name,
        urlVerification,
      );
      if (process.env.NODE_ENV == 'test') {
        result.token_reset_password = token;
        result.url = urlVerification;
      }
      this.notificationService.sendEmail(
        userAccount.email,
        'Verifikasi Ulang Email',
        '',
        messageUrlVerifivation,
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

      const smsMessage = await generateSmsUrlVerification(
        userAccount.name,
        urlVerification,
      );

      this.notificationService.sendSms(userAccount.phone, smsMessage);

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
