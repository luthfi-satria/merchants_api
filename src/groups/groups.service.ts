/* eslint-disable prettier/prettier */
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
import { Brackets, Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { deleteCredParam } from 'src/utils/general-utils';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { CreateGroupDTO } from './validation/create_groups.dto';
import { GroupUsersService } from './group_users.service';
import { GroupUser } from './interface/group_users.interface';
import { UpdateGroupDTO } from './validation/update_groups.dto';
import { ListGroupDTO } from './validation/list-group.validation';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly groupUserService: GroupUsersService,
    private readonly storage: CommonStorageService,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async findMerchantById(id: string): Promise<GroupDocument> {
    return this.groupRepository.findOne({ id: id });
  }

  async findMerchantByPhone(phone: string): Promise<GroupDocument> {
    return this.groupRepository.findOne({ where: { phone: phone } });
  }

  async findMerchantByPhoneExceptId(
    phone: string,
    id: string,
  ): Promise<GroupDocument> {
    return this.groupRepository.findOne({ where: { phone, id } });
  }

  async findMerchantByEmail(email: string): Promise<GroupDocument> {
    return this.groupRepository.findOne({
      where: { email: email },
    });
  }

  async createMerchantGroupProfile(
    createGroupDTO: CreateGroupDTO,
  ): Promise<GroupDocument> {
    const salt: string = await this.hashService.randomSalt();
    createGroupDTO.director_password = await this.hashService.hashPassword(
      createGroupDTO.director_password,
      salt,
    );
    createGroupDTO.pic_operational_password =
      await this.hashService.hashPassword(
        createGroupDTO.pic_operational_password,
        salt,
      );
    createGroupDTO.pic_finance_password = await this.hashService.hashPassword(
      createGroupDTO.pic_finance_password,
      salt,
    );
    const create_group = this.groupRepository.create(createGroupDTO);
    if (createGroupDTO.status == 'ACTIVE') create_group.approved_at = new Date();
    try {
      const create = await this.groupRepository.save(create_group);
      if (!create) {
        throw new Error('failed insert to merchant_group');
      }

      const array_email = [];
      create.users = [];
      array_email.push(createGroupDTO.director_email);
      const create_director: Partial<GroupUser> = {
        group_id: create.id,
        name: createGroupDTO.director_name,
        phone: createGroupDTO.director_phone,
        email: createGroupDTO.director_email,
        password: createGroupDTO.director_password,
        nip: createGroupDTO.director_nip,
      };
      const director = await this.groupUserService.createUserPassword(
        create_director,
      );
      create.users.push(director);
      if (!array_email.includes(createGroupDTO.pic_operational_email)) {
        array_email.push(createGroupDTO.pic_operational_email);
        const create_pic_operational: Partial<GroupUser> = {
          group_id: create.id,
          name: createGroupDTO.pic_operational_name,
          phone: createGroupDTO.pic_operational_phone,
          email: createGroupDTO.pic_operational_email,
          password: createGroupDTO.pic_operational_password,
          nip: createGroupDTO.pic_operational_nip,
        };
        const pic_operational =
          await this.groupUserService.createUserPassword(
            create_pic_operational,
          );
        create.users.push(pic_operational);
      }
      if (!array_email.includes(createGroupDTO.pic_finance_email)) {
        array_email.push(createGroupDTO.pic_finance_email);
        const create_pic_finance: Partial<GroupUser> = {
          group_id: create.id,
          name: createGroupDTO.pic_finance_name,
          phone: createGroupDTO.pic_finance_phone,
          email: createGroupDTO.pic_finance_email,
          password: createGroupDTO.pic_finance_password,
          nip: createGroupDTO.pic_finance_nip,
        };
        const pic_finance =
          await this.groupUserService.createUserPassword(create_pic_finance);
        create.users.push(pic_finance);
      }
      return create;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: error.column,
            constraint: [error.message],
          },
          'Bad Request',
        ),
      );
    }
  }

  async updateMerchantGroupProfile(
    updateGroupDTO: UpdateGroupDTO,
    id: string,
  ): Promise<GroupDocument> {
    const group = await this.groupRepository.findOne({
      relations: ['users'],
      where: { id },
    });

    group.users = [];
    const update_director: Partial<GroupUser> = {
      group_id: id,
      name: updateGroupDTO.director_name,
      phone: updateGroupDTO.director_phone,
      email: updateGroupDTO.director_email,
      nip: updateGroupDTO.director_nip,
    };
    const director = await this.groupUserService.updateUserByEmailGroupId(
      update_director,
      group.director_email,
    );
    group.users.push(director);

    const update_pic_operational: Partial<GroupUser> = {
      group_id: id,
      name: updateGroupDTO.pic_operational_name,
      phone: updateGroupDTO.pic_operational_phone,
      email: updateGroupDTO.pic_operational_email,
      nip: updateGroupDTO.pic_operational_nip,
    };
    const pic_operational =
      await this.groupUserService.updateUserByEmailGroupId(
        update_pic_operational,
        group.pic_operational_email,
      );
    group.users.push(pic_operational);

    const update_pic_finance: Partial<GroupUser> = {
      group_id: id,
      name: updateGroupDTO.pic_finance_name,
      phone: updateGroupDTO.pic_finance_phone,
      email: updateGroupDTO.pic_finance_email,
      nip: updateGroupDTO.pic_finance_nip,
    };
    const pic_finance = await this.groupUserService.updateUserByEmailGroupId(
      update_pic_finance,
      group.pic_finance_email,
    );
    group.users.push(pic_finance);
    if (updateGroupDTO.status == 'ACTIVE') group.approved_at = new Date();

    Object.assign(group, updateGroupDTO);
    const update_group = this.groupRepository.save(group);
    if (!update_group) {
      throw new Error('Update Failed');
    }
    return group;
  }

  async deleteMerchantGroupProfile(data: string): Promise<any> {
    const cekid = await this.findMerchantById(data);
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
      .softDelete({
        id: data,
      })
      .then(() => {
        return this.merchantUsersRepository.softDelete({ group_id: data });
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

  async viewGroupDetail(id: string, user: Record<string, any>): Promise<RSuccessMessage> {
    try {
      const gid = user.user_type == 'admin' ? id : user.group_id;
      const result = await this.groupRepository.findOne(gid);
    return this.responseService.success(
        true,
        this.messageService.get('merchant.listgroup.success'),
        result,
      );
    } catch (error) {
      const errors: RMessage = {
        value: '',
        property: 'listgroup',
        constraint: [this.messageService.get('merchant.listgroup.fail')],
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

  async listGroup(
    data: ListGroupDTO,
    user: Record<string, any>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;

    const query = this.groupRepository.createQueryBuilder();

    if (search) {
      query.where(
        new Brackets((qb) => {
          qb.where('name ilike :name', { name: '%' + search + '%' });
          qb.orWhere('director_name ilike :oname', {
            oname: '%' + search + '%',
          });
          qb.orWhere('director_email ilike :email', {
            email: '%' + search + '%',
          });
          qb.orWhere('phone ilike :ghp', {
            ghp: '%' + search + '%',
          });
          qb.orWhere('address ilike :adg', {
            adg: '%' + search + '%',
          });
        }),
      );
    }

    if (data.group_category) {
      query.andWhere('category = :gcat', {
        gcat: data.group_category,
      });
    }

    if (data.status) {
      query.andWhere('status = :gstat', {
        gstat: data.status,
      });
    }

    if (user.level == 'group') {
      query.andWhere('id = :id', {
        id: user.group_id,
      });
    }

    query
      .orderBy('created_at', 'DESC')
      .offset((Number(currentPage) - 1) * perPage)
      .limit(perPage);

    const count = await query.getCount();
    const list = await query.getMany();
    list.forEach(element => {
      return deleteCredParam(element);
    });
    return {
      total_item: count,
      limit: Number(perPage),
      current_page: Number(currentPage),
      items: list,
    };
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
