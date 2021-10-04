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
  dbOutputTime,
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { Brackets, FindOperator, Not, Repository } from 'typeorm';
import { MerchantGroupUsersValidation } from './validation/groups_users.validation';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { GroupDocument } from 'src/database/entities/group.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { GroupUser } from './interface/group_users.interface';
import { randomUUID } from 'crypto';
import { ListGroupUserDTO } from './validation/list-group-user.validation';
import { RoleService } from 'src/common/services/admins/role.service';
import _ from 'lodash';
import { GroupsService } from './groups.service';
import { User, UserType } from 'src/auth/guard/interface/user.interface';

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
  ): Promise<MerchantUsersDocument> {
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
      password: passwordHash,
      group,
    };
    Object.assign(createGroupUser, args);

    try {
      const resultCreate = await this.merchantUsersRepository.save(
        createGroupUser,
      );

      removeAllFieldPassword(resultCreate);
      formatingAllOutputTime(resultCreate);
      resultCreate.role_name = role.name;

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
  ): Promise<RSuccessMessage> {
    const gUsersExist: MerchantUsersDocument =
      await this.merchantUsersRepository
        .findOne({
          where: { id: args.id, group_id: args.group_id },
          relations: ['group'],
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

    if (typeof args.name != 'undefined' && args.name != '')
      gUsersExist.name = args.name;
    if (typeof args.phone != 'undefined' && args.phone != '') {
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
    if (typeof args.email != 'undefined' && args.email != '') {
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
    if (typeof args.password != 'undefined' && args.password != '') {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        args.password,
        salt,
      );
      gUsersExist.password = passwordHash;
    }

    return await this.merchantUsersRepository
      .save(gUsersExist)
      .then(async (result) => {
        dbOutputTime(result);
        dbOutputTime(result.group);
        delete result.password;
        // delete result.group.owner_password;

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

  async deleteGroupUsers(
    args: Partial<MerchantGroupUsersValidation>,
  ): Promise<RSuccessMessage> {
    const gUsersExist: MerchantUsersDocument =
      await this.merchantUsersRepository
        .findOne({
          where: { id: args.id, group_id: args.group_id },
          relations: ['group'],
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

  async listGroupUsers(args: Partial<ListGroupUserDTO>): Promise<ListResponse> {
    const search = args.search || '';
    const currentPage = Number(args.page) || 1;
    const perPage = Number(args.limit) || 10;

    const query = this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
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
    if (args.group_id) {
      query.andWhere('mu.group_id = :group_id', { group_id: args.group_id });
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
    merchant_id?: string,
  ): Promise<MerchantUsersDocument> {
    const where: { id: string; merchant_id?: string } = { id };
    if (merchant_id) {
      where.merchant_id = merchant_id;
    }
    try {
      const merchant_user: MerchantUsersDocument =
        await this.merchantUsersRepository.findOne({
          where,
        });

      if (!merchant_user) {
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

      return merchant_user;
    } catch (error) {
      Logger.error(error);
    }
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
