import {
  BadRequestException,
  ForbiddenException,
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
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { Brackets, FindOperator, Not, Repository, UpdateResult } from 'typeorm';
import { MerchantGroupUsersValidation } from './validation/groups_users.validation';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { GroupDocument } from 'src/database/entities/group.entity';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import { GroupUser } from './interface/group_users.interface';
import { randomUUID } from 'crypto';
import { ListGroupUserDTO } from './validation/list-group-user.validation';
import { RoleService } from 'src/common/services/admins/role.service';
import _ from 'lodash';
import { GroupsService } from './groups.service';
import { UserType } from 'src/auth/guard/interface/user.interface';
import { NotificationService } from 'src/common/notification/notification.service';
import { UpdatePhoneGroupUsersValidation } from './validation/update_phone_group_users.validation';
import { UpdateEmailGroupUsersValidation } from './validation/update_email_group_users.validation';

@Injectable()
export class GroupUsersService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupService: GroupsService,
    private readonly notificationService: NotificationService,
  ) {}

  async createUserWithoutPassword(groupUser: Partial<GroupUser>) {
    groupUser.token_reset_password = randomUUID();
    return this.merchantUsersRepository.save(groupUser);
  }

  async createUserPassword(groupUser: Partial<GroupUser>) {
    groupUser.token_reset_password = randomUUID();
    const result = await this.merchantUsersRepository.save(groupUser);
    delete result.password;
    return result;
  }

  async updateUserByEmailGroupId(groupUser: Partial<GroupUser>, email: string) {
    try {
      const user = await this.merchantUsersRepository.findOne({
        where: { email, group_id: groupUser.group_id },
      });
      if (!user) {
        const message = {
          value: groupUser.email,
          property: 'email',
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            message,
            'Bad Request',
          ),
        );
      }
      if (groupUser.email != email) {
        const cekemail = await this.merchantUsersRepository.findOne({
          where: { email: groupUser.email },
        });
        if (cekemail) {
          const message = {
            value: groupUser.email,
            property: 'email',
            constraint: [
              this.messageService.get('merchant.general.emailExist'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              message,
              'Bad Request',
            ),
          );
        }
      }
      const cekphone: MerchantUsersDocument =
        await this.merchantUsersRepository.findOne({
          where: { phone: groupUser.phone, email: Not(email) },
        });
      if (cekphone) {
        const message = {
          value: groupUser.phone,
          property: 'phone',
          constraint: [this.messageService.get('merchant.general.phoneExist')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            message,
            'Bad Request',
          ),
        );
      }
      delete groupUser.password;
      Object.assign(user, groupUser);
      return await this.merchantUsersRepository.save(user);
    } catch (err) {
      console.error('data error: ', groupUser);
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

  async createGroupUsers(
    args: MerchantGroupUsersValidation,
  ): Promise<Record<string, any>> {
    const group = await this.groupService.getAndValidateGroupByGroupId(
      args.group_id,
    );
    await this.getAndValidateGroupUserByPhone(args.phone);
    await this.getAndValidateGroupUserByEmail(args.email);
    const role = await this.roleService.getAndValodateRoleByRoleId(
      args.role_id,
    );

    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      args.password,
      salt,
    );
    const createGroupUser: Partial<MerchantUsersDocument> = {
      ...args,
      password: passwordHash,
      group,
    };
    if (args.status && args.status == MerchantUsersStatus.Rejected)
      createGroupUser.rejected_at = new Date();

    const token = randomUUID();
    createGroupUser.token_reset_password = token;

    try {
      const resultCreate: Record<string, any> =
        await this.merchantUsersRepository.save(createGroupUser);

      removeAllFieldPassword(resultCreate);
      formatingAllOutputTime(resultCreate);
      resultCreate.role_name = role.name;

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;
      if (process.env.NODE_ENV == 'test') {
        resultCreate.token_reset_password = token;
        resultCreate.url = urlVerification;
      }

      this.notificationService.sendSms(args.phone, urlVerification);

      return resultCreate;
    } catch (err) {
      Logger.error(err);
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

  async updateGroupUsers(
    args: Partial<MerchantGroupUsersValidation>,
    user: any,
  ): Promise<MerchantUsersDocument> {
    const getUsersExist = await this.getAndValidateGroupUserById(args.id, user);
    Object.assign(getUsersExist, args);

    if (args.phone) {
      await this.getAndValidateGroupUserByPhone(args.phone, args.id);
    }
    if (args.email) {
      await this.getAndValidateGroupUserByEmail(args.email, args.id);
    }
    let role = null;
    if (args.role_id) {
      role = await this.roleService.getAndValodateRoleByRoleId(args.role_id);
    }

    if (typeof args.password != 'undefined' && args.password != '') {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        args.password,
        salt,
      );
      getUsersExist.password = passwordHash;
    }
    if (args.status && args.status == MerchantUsersStatus.Rejected)
      getUsersExist.rejected_at = new Date();

    try {
      const createResult = await this.merchantUsersRepository.save(
        getUsersExist,
      );
      formatingAllOutputTime(createResult);
      removeAllFieldPassword(createResult);
      if (args.role_id) {
        createResult.role_name = role.name;
      }

      return createResult;
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

  async deleteGroupUsers(user_id: string, user: any): Promise<UpdateResult> {
    await this.getAndValidateGroupUserById(user_id, user);
    try {
      return await this.merchantUsersRepository.softDelete({
        id: user_id,
      });
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

  async listGroupUsers(
    args: Partial<ListGroupUserDTO>,
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
      )
      .andWhere('mu.group_id is not null');
    if (user && user.level == 'group') {
      query.andWhere('mu.group_id = :group_id', { group_id: user.group_id });
    }

    if (args.group_id) {
      query.andWhere('mu.group_id = :group_id', { group_id: args.group_id });
    }

    if (args.role_id) {
      query.andWhere('mu.role_id = :role_id', { role_id: args.role_id });
    }

    if (args.statuses) {
      query.andWhere('mu.status in (:...statuses)', {
        statuses: args.statuses,
      });
    }
    query
      .orderBy('mu.name')
      .offset((currentPage - 1) * perPage)
      .limit(perPage);
    try {
      const listGroupUsers = await query.getMany();
      const countGroupUsers = await query.getCount();

      const role_ids: string[] = [];
      listGroupUsers.forEach((raw) => {
        if (raw.role_id) {
          role_ids.push(raw.role_id);
        }
      });

      const roles = await this.roleService.getRole(role_ids);

      if (roles) {
        listGroupUsers.forEach((raw) => {
          const roleName = _.find(roles, { id: raw.role_id });
          raw.role_name = roleName ? roleName.name : null;
        });
      }

      formatingAllOutputTime(listGroupUsers);
      removeAllFieldPassword(listGroupUsers);

      const listResult: ListResponse = {
        total_item: countGroupUsers,
        limit: perPage,
        current_page: currentPage,
        items: listGroupUsers,
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

  async detailGroupUser(
    user_id: string,
    user: any,
  ): Promise<MerchantUsersDocument> {
    let user_group = null;
    try {
      const query = this.merchantUsersRepository
        .createQueryBuilder('mu')
        .leftJoinAndSelect('mu.store', 'merchant_store')
        .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
        .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
        .leftJoinAndSelect('mu.group', 'merchant_group')
        .where('mu.id = :user_id', { user_id })
        .andWhere('mu.group_id is not null');
      if (user && user.level == 'group') {
        query.andWhere('mu.group_id = :group_id', { group_id: user.group_id });
      }

      user_group = await query.getOne();
    } catch (error) {
      Logger.error(error);
    }
    if (!user_group) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user_id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const roles = await this.roleService.getRole([user_group.role_id]);

    if (roles && user_group.role_id) {
      const roleName = _.find(roles, { id: user_group.role_id });
      user_group.role_name = roleName ? roleName.name : null;
    }

    removeAllFieldPassword(user_group);
    formatingAllOutputTime(user_group);

    return user_group;
  }

  async updatePhoneGroupUsers(
    userId: string,
    args: UpdatePhoneGroupUsersValidation,
    user: any,
  ) {
    const merchantUser = await this.getAndValidateGroupUserById(userId, user);

    await this.getAndValidateGroupUserByPhone(args.phone, userId);
    merchantUser.phone = args.phone;

    try {
      const result = await this.merchantUsersRepository.save(merchantUser);
      formatingAllOutputTime(result);
      removeAllFieldPassword(result);

      this.notificationService.sendSms(
        merchantUser.phone,
        'Nomor Anda telah digunakan sebagai login baru',
      );

      return result;
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

  async updateEmailGroupUsers(
    userId: string,
    args: UpdateEmailGroupUsersValidation,
    user: any,
  ) {
    const merchantUser = await this.getAndValidateGroupUserById(userId, user);

    await this.getAndValidateGroupUserByEmail(args.email, userId);
    merchantUser.email = args.email;

    try {
      const result = await this.merchantUsersRepository.save(merchantUser);
      formatingAllOutputTime(result);
      removeAllFieldPassword(result);

      this.notificationService.sendEmail(
        merchantUser.email,
        'Email Anda telah aktif',
        'Alamat email Anda telah digunakan sebagai login baru',
      );

      return result;
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

  async updatePasswordGroupUsers(userId: string, user: any) {
    const merchantUser = await this.getAndValidateGroupUserById(userId, user);

    const token = randomUUID();
    merchantUser.token_reset_password = token;

    try {
      const result = await this.merchantUsersRepository.save(merchantUser);
      formatingAllOutputTime(result);
      removeAllFieldPassword(result);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      this.notificationService.sendSms(merchantUser.phone, urlVerification);

      return result;
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
  //--------------------------------General Function------------------------------------

  async getAndValidateGroupUserByPhone(
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

  async getAndValidateGroupUserByEmail(
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

  async getAndValidateGroupUserById(
    id: string,
    user: any,
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
      .where('mu.id = :id', { id })
      .andWhere('mu.group_id is not null');
    if (user && user.level == 'group') {
      query.andWhere('mu.group_id = :group_id', { group_id: user.group_id });
      query.andWhere("mu.status != 'WAITING_FOR_APPROVAL'");
    }
    const user_group = await query.getOne();
    if (!user_group) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    return user_group;
  }

  async isCanModifDataValidation(user: any, group_id: string) {
    if (user.user_type == UserType.Admin) {
      return true;
    }

    if (user.group_id == group_id) {
      return true;
    }

    Logger.error(
      'User forbidden, because users can only create for their own data.',
    );
    const errors: RMessage = {
      value: user.group_id,
      property: 'user_group_id',
      constraint: [this.messageService.get('merchant_user.general.forbidden')],
    };
    throw new ForbiddenException(
      this.responseService.error(
        HttpStatus.FORBIDDEN,
        errors,
        'Forbidden Access',
      ),
    );
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
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
