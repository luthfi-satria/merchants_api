import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { randomUUID } from 'crypto';
import _ from 'lodash';
import { catchError, map, Observable } from 'rxjs';
import { NotificationService } from 'src/common/notification/notification.service';
import { CommonStoresService } from 'src/common/own/stores.service';
import { RoleDTO } from 'src/common/services/admins/dto/role.dto';
import { RoleService } from 'src/common/services/admins/role.service';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { GroupsService } from 'src/groups/groups.service';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { StoresService } from 'src/stores/stores.service';
import {
  deleteCredParam,
  formatingAllOutputTime,
  generateMessageChangeActiveEmail,
  generateMessageUrlVerification,
  generateSmsChangeActiveNoHp,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { Brackets, FindOperator, Not, Repository, UpdateResult } from 'typeorm';
import {
  generateSmsResetPassword,
  generateSmsUrlVerification,
} from './../utils/general-utils';
import { MerchantsService } from './merchants.service';
import {
  GetMerchantUsers,
  ListMerchantUsersValidation,
} from './validation/list_merchants_users.validation';
import {
  CreateMerchantUsersValidation,
  UpdateMerchantUsersValidation,
} from './validation/merchants_users.validation';
import { MerchantUsersUpdateEmailValidation } from './validation/merchants_users_update_email.validation';
import { MerchantUsersUpdatePhoneValidation } from './validation/merchants_users_update_phone.validation';

@Injectable()
export class MerchantUsersService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantService: MerchantsService,
    private readonly notificationService: NotificationService,
    private readonly commonStoresService: CommonStoresService,
    private readonly groupService: GroupsService,
    @Inject(forwardRef(() => StoresService))
    private readonly storeService: StoresService,
  ) {}

  async findByMerchantId(mid: string): Promise<MerchantUsersDocument> {
    return this.merchantUsersRepository.findOne({
      where: { merchant_id: mid },
    });
  }

  async findById(id: string): Promise<MerchantUsersDocument> {
    return this.merchantUsersRepository.findOne({
      where: { id: id },
    });
  }

  async createMerchantUsers(
    args: CreateMerchantUsersValidation,
    user: any,
  ): Promise<Record<string, any>> {
    const merchant =
      await this.merchantService.getAndValidateMerchantActiveById(
        args.merchant_id,
      );

    let stores = null;
    if (args.store_ids) {
      stores = await this.commonStoresService.getAndValidateStoreByStoreIds(
        args.store_ids,
        user,
        args.merchant_id,
      );
    }
    await this.validateMerchantUserUniquePhone(args.phone);
    await this.validateMerchantUserUniqueEmail(args.email);

    const role = await this.roleService.getRoleAndValidatePlatformByRoleId(
      args.role_id,
      'HERMES_BRAND',
    );

    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      args.password,
      salt,
    );
    const createMerchantUser: Partial<MerchantUsersDocument> = {
      merchant,
    };
    Object.assign(createMerchantUser, args);
    createMerchantUser.password = passwordHash;
    createMerchantUser.stores = stores;
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

      const createMerchant: Record<string, any> =
        await this.merchantUsersRepository.save(createMerchantUser);

      createMerchant.role_name = role.name;
      formatingAllOutputTime(createMerchant);
      removeAllFieldPassword(createMerchant);

      const url = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;

      if (process.env.NODE_ENV == 'test') {
        createMerchant.url = url;
        createMerchant.token_reset_password = token;
      }

      if (!bypassUser) {
        const smsMessage = await generateSmsUrlVerification(
          createMerchant.name,
          url,
        );

        this.notificationService.sendSms(createMerchant.phone, smsMessage);
      }
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
    args: UpdateMerchantUsersValidation,
    user: any,
    id: string,
  ): Promise<MerchantUsersDocument> {
    const usersExist = await this.getAndValidateMerchantUserById(id, user);
    Object.assign(usersExist, args);

    if (args.merchant_id) {
      const merchant = await this.merchantRepository.findOne({
        where: { id: args.merchant_id },
      });
      if (merchant) {
        usersExist.merchant = merchant;
      }
    }

    if (args.store_ids) {
      usersExist.stores =
        await this.commonStoresService.getAndValidateStoreByStoreIds(
          args.store_ids,
          user,
          usersExist.merchant_id,
        );
    }

    if (args.phone) {
      await this.validateMerchantUserUniquePhone(args.phone, id);
    }

    if (args.email) {
      await this.validateMerchantUserUniqueEmail(args.email, id);
    }

    let role: RoleDTO;
    if (args.role_id) {
      usersExist.role_id = args.role_id;
      role = await this.roleService.getRoleAndValidatePlatformByRoleId(
        args.role_id,
        'HERMES_BRAND',
      );
    }

    if (args.password) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        args.password,
        salt,
      );
      usersExist.password = passwordHash;
    }
    usersExist.name = args.name ? args.name : usersExist.name;
    usersExist.nip = args.nip ? args.nip : usersExist.nip;
    usersExist.status = args.status ? args.status : usersExist.status;

    try {
      const resultUpdate = await this.merchantUsersRepository.save(usersExist);
      removeAllFieldPassword(resultUpdate);
      if (args.role_id) {
        resultUpdate.role_name = role.name;
      }

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

  async updatePasswordMerchantUsers(userId: string, user?: any) {
    const merchantUser = await this.getAndValidateMerchantUserById(
      userId,
      user,
    );

    const token = randomUUID();
    merchantUser.token_reset_password = token;

    try {
      const result = await this.merchantUsersRepository.save(merchantUser);
      formatingAllOutputTime(result);
      delete result.password;

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      const smsMessage = await generateSmsResetPassword(
        merchantUser.name,
        urlVerification,
      );

      this.notificationService.sendSms(merchantUser.phone, smsMessage);

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

  async updatePhoneMerchantUsers(
    args: MerchantUsersUpdatePhoneValidation,
    user: any,
  ): Promise<any> {
    const merchantUser = await this.getAndValidateMerchantUserById(
      args.id,
      user,
    );
    await this.validateMerchantUserUniquePhone(args.phone, args.id);
    Object.assign(merchantUser, args);

    const token = randomUUID();
    merchantUser.token_reset_password = token;

    try {
      await this.merchantUsersRepository.save(merchantUser);

      const smsMessage = generateSmsChangeActiveNoHp(merchantUser.name);

      // biarkan tanpa await karena dilakukan secara asynchronous
      this.notificationService.sendSms(merchantUser.phone, smsMessage);
    } catch (err) {
      console.error(err);
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
    }
  }

  async updateEmailMerchantUsers(
    args: MerchantUsersUpdateEmailValidation,
    user: any,
  ): Promise<any> {
    const merchantUser = await this.getAndValidateMerchantUserById(
      args.id,
      user,
    );
    await this.validateMerchantUserUniqueEmail(args.email, args.id);
    Object.assign(merchantUser, args);

    const token = randomUUID();
    merchantUser.token_reset_password = token;

    try {
      await this.merchantUsersRepository.save(merchantUser);
      const url = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      // biarkan tanpa await karena dilakukan secara asynchronous
      if (merchantUser.email_verified_at) {
        const messageChangeActiveEmail = generateMessageChangeActiveEmail(
          merchantUser.name,
        );
        this.notificationService.sendEmail(
          merchantUser.email,
          'Email Anda telah aktif',
          '',
          messageChangeActiveEmail,
        );
      } else {
        const messageUrlVerifivation = await generateMessageUrlVerification(
          merchantUser.name,
          url,
        );
        this.notificationService.sendEmail(
          merchantUser.email,
          'Perubahan Email',
          '',
          messageUrlVerifivation,
        );
      }

      if (process.env.NODE_ENV == 'test') {
        return { status: true, token: token, url: url };
      } else {
        return { status: true };
      }
    } catch (err) {
      console.error(err);
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
    }
  }

  async deleteMerchantUsers(user_id: string, user: any): Promise<UpdateResult> {
    if (user_id == user.id) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user_id,
            property: 'user_id',
            constraint: [
              this.messageService.get('merchant_user.delete.self_delete'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    await this.getAndValidateMerchantUserById(user_id, user);

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
    user: any,
  ): Promise<ListResponse> {
    const search = args.search || '';
    const currentPage = Number(args.page) || 1;
    const perPage = Number(args.limit) || 10;

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
      // get data group in stores (many-to-many)
      .leftJoinAndSelect('mu.stores', 'user_stores')
      .where('mu.merchant_id is not null')
      .andWhere(
        new Brackets((qb) => {
          qb.where('mu.name ilike :mname', {
            mname: '%' + search + '%',
          })
            .orWhere('mu.phone ilike :sphone', {
              sphone: '%' + search + '%',
            })
            .orWhere('mu.nip like :mnip', {
              mnip: '%' + search + '%',
            })
            .orWhere('merchant_group.name like :gname', {
              gname: '%' + search + '%',
            })
            .orWhere('merchant_merchant.name like :mmname', {
              mmname: '%' + search + '%',
            });
        }),
      );

    // filter by access use
    if (user && user.level == 'merchant') {
      query.andWhere(
        new Brackets((queryBracket) => {
          queryBracket.where('mu.merchant_id = :merchant_id', {
            merchant_id: user.merchant_id,
          });
          queryBracket.orWhere('merchant_store.merchant_id = :merchant_id', {
            merchant_id: user.merchant_id,
          });
        }),
      );
    } else if (user && user.level == 'group') {
      query.andWhere(
        new Brackets((queryBracket) => {
          queryBracket.where('mu.group_id = :group_id', {
            group_id: user.group_id,
          });
          queryBracket.orWhere('merchant_merchant.group_id = :group_id', {
            group_id: user.group_id,
          });
          queryBracket.orWhere('merchant_store_merchant.group_id = :group_id', {
            group_id: user.group_id,
          });
        }),
      );
    }
    // end filter by access use

    if (args.merchant_id) {
      query.andWhere('mu.merchant_id = :merchant_id', {
        merchant_id: args.merchant_id,
      });
    }

    if (args.role_id) {
      query.andWhere('mu.role_id = :role_id', { role_id: args.role_id });
    }

    if (args.group_id) {
      query.andWhere('merchant_merchant.group_id = :group_id', {
        group_id: args.group_id,
      });
    }

    if (args.statuses) {
      query.andWhere('mu.status in (:...statuses)', {
        statuses: args.statuses,
      });
    }

    try {
      const result_merchant = await query
        .orderBy('mu.name')
        .skip((currentPage - 1) * perPage)
        .take(perPage)
        .getManyAndCount();

      formatingAllOutputTime(result_merchant[0]);
      removeAllFieldPassword(result_merchant[0]);

      const role_ids: string[] = [];
      // result_merchant[0].forEach((raw) => {
      for (const raw of result_merchant[0]) {
        if (raw.role_id) {
          role_ids.push(raw.role_id);
        }
        if (raw.merchant) {
          await this.merchantService.manipulateMerchantUrl(raw.merchant);
          if (raw.merchant.group) {
            await this.groupService.manipulateGroupUrl(raw.merchant.group);
          }
        }
        if (raw.stores && raw.stores.length > 0) {
          for (const store of raw.stores) {
            await this.storeService.manipulateStoreUrl(store);
          }
        }
      }

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

  async detailMerchantUsers(
    user_id: string,
    user: any,
  ): Promise<MerchantUsersDocument> {
    const merchantUser = await this.getAndValidateMerchantUserById(
      user_id,
      user,
    );
    formatingAllOutputTime(merchantUser);
    removeAllFieldPassword(merchantUser);

    try {
      const roles = await this.roleService.getRole([merchantUser.role_id]);
      if (roles) {
        const roleName = _.find(roles, { id: merchantUser.role_id });
        merchantUser.role_name = roleName ? roleName.name : null;
      }

      return merchantUser;
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
              property: 'pic_email',
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
            property: 'pic_phone',
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

    //Cheking Env Bypass Verification
    const bypassEnv = process.env.HERMES_USER_REGISTER_BYPASS;
    const bypassUser = bypassEnv && bypassEnv == 'true' ? true : false;
    if (bypassUser) {
      args.email_verified_at = new Date();
      args.phone_verified_at = new Date();
    }

    const result: Record<string, any> = await this.merchantUsersRepository.save(
      args,
    );
    const url = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${result.token_reset_password}`;

    if (process.env.NODE_ENV == 'test') {
      result.url = url;
    }

    if (!bypassUser) {
      const smsMessage = await generateSmsUrlVerification(args.name, url);

      this.notificationService.sendSms(args.phone, smsMessage);
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

  async validateMerchantUserUniquePhone(
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

  async validateMerchantUserUniqueEmail(
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

  async getAndValidateMerchantUserById(
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
      // get data group in stores (many-to-many)
      .leftJoinAndSelect('mu.stores', 'user_stores')
      .where('mu.id = :user_id', { user_id })
      .andWhere('mu.merchant_id is not null');

    if (user && user.level == 'merchant') {
      query.andWhere(
        new Brackets((queryBracket) => {
          queryBracket.where('mu.merchant_id = :merchant_id', {
            merchant_id: user.merchant_id,
          });
          queryBracket.orWhere('merchant_store.merchant_id = :merchant_id', {
            merchant_id: user.merchant_id,
          });
        }),
      );
    } else if (user && user.level == 'group') {
      query.andWhere(
        new Brackets((queryBracket) => {
          queryBracket.where('mu.group_id = :group_id', {
            group_id: user.group_id,
          });
          queryBracket.orWhere('merchant_merchant.group_id = :group_id', {
            group_id: user.group_id,
          });
          queryBracket.orWhere('merchant_store_merchant.group_id = :group_id', {
            group_id: user.group_id,
          });
        }),
      );
    }
    const merechant_user = await query.getOne();
    if (!merechant_user) {
      const errors: RMessage = {
        value: user_id,
        property: 'merechant_user_id',
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
    return merechant_user;
  }

  async getMerchantUserById(user: any): Promise<MerchantUsersDocument> {
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
      // get data group in stores (many-to-many)
      .leftJoinAndSelect('mu.stores', 'user_stores')
      .where('mu.id = :muid', { muid: user.id });

    const merechant_user = await query.getOne();
    if (!merechant_user) {
      const errors: RMessage = {
        value: '',
        property: `${user.level}_id`,
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
    return merechant_user;
  }

  async getMerchantUserByLevelId(user: any): Promise<MerchantUsersDocument> {
    const query = this.merchantUsersRepository
      .createQueryBuilder('mu')
      // get data group in stores (many-to-many)
      .leftJoinAndSelect('mu.stores', 'user_stores');

    if (user && user.level == 'store') {
      // get data group in store
      query
        .leftJoinAndSelect('mu.store', 'merchant_store')
        .leftJoinAndSelect('merchant_store.merchant', 'merchant_store_merchant')
        .leftJoinAndSelect(
          'merchant_store_merchant.group',
          'merchant_store_merchant_group',
        )
        .where(
          new Brackets((queryBracket) => {
            queryBracket.where('mu.store_id = :store_id', {
              store_id: user.store_id,
            });
          }),
        );
    } else if (user && user.level == 'merchant') {
      // get data group in merchant
      query
        .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
        .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
        .where(
          new Brackets((queryBracket) => {
            queryBracket.where('mu.merchant_id = :merchant_id', {
              merchant_id: user.merchant_id,
            });
          }),
        );
    } else if (user && user.level == 'group') {
      query.leftJoinAndSelect('mu.group', 'merchant_group').where(
        new Brackets((queryBracket) => {
          queryBracket.where('mu.group_id = :group_id', {
            group_id: user.group_id,
          });
        }),
      );
    }
    const merechant_user = await query.getOne();
    if (!merechant_user) {
      const errors: RMessage = {
        value: '',
        property: `${user.level}_id`,
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
    return merechant_user;
  }

  async getMerchantUserGroupById(
    user_id: string,
    user?: any,
  ): Promise<MerchantUsersDocument> {
    const stat = 'ACTIVE';

    const query = this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.group', 'group', 'group.status = :stat', {
        stat,
      })
      .leftJoinAndSelect(
        'group.merchants',
        'gmerchant',
        'gmerchant.status = :stat',
        { stat },
      )
      .leftJoinAndSelect(
        'gmerchant.stores',
        'gmstore',
        'gmstore.status = :stat',
        { stat },
      )
      .leftJoinAndSelect('mu.merchant', 'merchant', 'merchant.status = :stat', {
        stat,
      })
      .leftJoinAndSelect('merchant.stores', 'mstore', 'mstore.status = :stat', {
        stat,
      })
      .leftJoinAndSelect('mu.store', 'store', 'store.status = :stat', {
        stat,
      })
      .leftJoinAndSelect('mu.stores', 'user_stores')
      .where('mu.id = :uid', { uid: user_id });

    const merechant_user = await query.getOne();
    if (!merechant_user) {
      const errors: RMessage = {
        value: user_id,
        property: 'merchant_user_id',
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

    const merchantUser: any = JSON.parse(JSON.stringify(merechant_user));
    if (merchantUser.group && merchantUser.group['__merchants__']) {
      delete Object.assign(merchantUser.group, {
        ['merchants']: merchantUser.group['__merchants__'],
      })['__merchants__'];
    }

    if (merchantUser.stores.length == 0) {
      if (merchantUser.group) {
        if (
          merchantUser.group.merchants &&
          merchantUser.group.merchants.length
        ) {
          for (const merchant of merchantUser.group.merchants) {
            if (merchant.stores && merchant.stores.length) {
              for (const store of merchant.stores) {
                merchantUser.stores.push(store);
              }
            }
          }
        }
      } else if (merchantUser.merchant) {
        if (
          merchantUser.merchant.stores &&
          merchantUser.merchant.stores.length
        ) {
          for (const store of merchantUser.merchant.stores) {
            merchantUser.stores.push(store);
          }
        }
      }
    }

    return merchantUser;
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

  async getMerchantUsers(data: GetMerchantUsers): Promise<any> {
    try {
      const merchantUsers = await this.merchantUsersRepository
        .findByIds(data.ids)
        .catch((error) => {
          console.error(error);
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: '',
                property: '',
                constraint: [
                  this.messageService.get('merchant.general.idNotFound'),
                ],
              },
              'Bad Request',
            ),
          );
        });

      return {
        merchant_users: merchantUsers.map((merchantUser: any) => {
          return deleteCredParam(merchantUser);
        }),
      };
    } catch (error) {
      console.error(error);
      throw error;
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
