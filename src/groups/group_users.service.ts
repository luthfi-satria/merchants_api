import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { Brackets, Not, Repository } from 'typeorm';
import { MerchantGroupUsersValidation } from './validation/groups_users.validation';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { GroupDocument } from 'src/database/entities/group.entity';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { GroupUser } from './interface/group_users.interface';
import { randomUUID } from 'crypto';

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
  ) {}

  async createUserWithoutPassword(groupUser: Partial<GroupUser>) {
    groupUser.token_reset_password = randomUUID();
    return await this.merchantUsersRepository.save(groupUser);
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
    args: Partial<MerchantGroupUsersValidation>,
  ): Promise<RSuccessMessage> {
    const cekGroupId = await this.groupRepository
      .findOne({
        id: args.group_id,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.group_id,
              property: 'group_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!cekGroupId) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.group_id,
            property: 'group_id',
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
    const createGroupUser: Partial<MerchantUsersDocument> = {
      name: args.name,
      phone: args.phone,
      email: args.email,
      group_id: args.group_id,
      password: passwordHash,
      group: cekGroupId,
    };

    return await this.merchantUsersRepository
      .save(createGroupUser)
      .then((result) => {
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

  async listGroupUsers(
    args: Partial<MerchantGroupUsersValidation>,
  ): Promise<RSuccessMessage> {
    const search = args.search || '';
    const currentPage = Number(args.page) || 1;
    const perPage = Number(args.limit) || 10;
    let totalItems: number;

    return await this.merchantUsersRepository
      .createQueryBuilder('mu')
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
      )
      .andWhere('mu.group_id = :gid', { gid: args.group_id })
      .orderBy('mu.name')
      .offset((currentPage - 1) * perPage)
      .limit(perPage)
      .getManyAndCount()
      .then(async (result) => {
        totalItems = result[1];
        result[0].forEach((raw) => {
          dbOutputTime(raw);
          dbOutputTime(raw.group);
          delete raw.password;
          // delete raw.group.owner_password;
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
