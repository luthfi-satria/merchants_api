/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GroupDocument, GroupStatus } from 'src/database/entities/group.entity';
import {
  Any,
  Brackets,
  Connection,
  FindOperator,
  ILike,
  Like,
  Not,
  QueryRunner,
  Repository,
} from 'typeorm';
import { AxiosResponse } from 'axios';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { deleteCredParam } from 'src/utils/general-utils';
import { HashService } from 'src/hash/hash.service';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import { CreateGroupDTO } from './validation/create_groups.dto';
import { GroupUsersService } from './group_users.service';
import { GroupUser } from './interface/group_users.interface';
import { UpdateGroupDTO } from './validation/update_groups.dto';
import { ListGroupDTO, SearchFields } from './validation/list-group.validation';
import {
  RoleService,
  SpecialRoleCodes,
} from 'src/common/services/admins/role.service';
import { NatsService } from 'src/nats/nats.service';
import _ from 'lodash';
import {
  MerchantDocument,
  MerchantStatus,
} from 'src/database/entities/merchant.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { LobService } from 'src/lob/lob.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoresService } from 'src/stores/stores.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { isDefined } from 'class-validator';
import {SetFieldEmptyUtils} from "../utils/set-field-empty-utils";
import { UpdateCorporateDto } from './validation/update-corporate.dto';
import { randomUUID } from 'crypto';
import { generateSmsUrlVerification } from './../utils/general-utils';
import { NotificationService } from 'src/common/notification/notification.service';


@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    private readonly groupUserService: GroupUsersService,
    private httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly roleService: RoleService,
    private readonly natsService: NatsService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantService: MerchantsService,
    @Inject(forwardRef(() => StoresService))
    private readonly storeService: StoresService,
    private readonly storage: CommonStorageService,
    private readonly connection: Connection,
    private readonly notificationService: NotificationService,
    private readonly lobService: LobService,
  ) {}

  async findGroupById(id: string): Promise<GroupDocument> {
    return this.groupRepository.findOne({ id: id });
  }

  async listGroupsByIds(ids: string[]): Promise<any> {
    try {
      if (!ids?.length) {
        return {
          total_item: 0,
          items: [],
        };
      }
      const [groups, count] = await this.groupRepository.findAndCount({
        where: { id: Any([ids]) },
      });

      if (!groups) {
        return {
          total_item: count,
          items: [],
        };
      }

      for (const element of groups) {
        deleteCredParam(element);

        await this.manipulateGroupUrl(element);
      }

      return {
        total_item: count,
        items: groups,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findGroupByPhone(phone: string): Promise<GroupDocument> {
    return this.groupRepository.findOne({ where: { phone: phone } });
  }

  async findGroupByPhoneExceptId(
    phone: string,
    id: string,
  ): Promise<GroupDocument> {
    return this.groupRepository.findOne({ where: { phone, id } });
  }

  async findGroupByEmail(email: string): Promise<GroupDocument> {
    return this.groupRepository.findOne({
      where: { email: email },
    });
  }

  async createMerchantGroupProfile(
    createGroupDTO: CreateGroupDTO,
  ): Promise<GroupDocument> {
    await this.validateGroupUniqueName(createGroupDTO.name);
    await this.validateGroupUniquePhone(createGroupDTO.phone);
    await this.groupUserService.validateGroupUserUniqueEmail(
      createGroupDTO.director_email,
      null,
      'director_email',
    );
    await this.groupUserService.validateGroupUserUniqueEmail(
      createGroupDTO.pic_finance_email,
      null,
      'pic_finance_email',
    );
    await this.groupUserService.validateGroupUserUniqueEmail(
      createGroupDTO.pic_operational_email,
      null,
      'pic_operational_email',
    );
    await this.groupUserService.validateGroupUserUniquePhone(
      createGroupDTO.director_phone,
      null,
      'director_phone',
    );
    await this.groupUserService.validateGroupUserUniquePhone(
      createGroupDTO.pic_finance_phone,
      null,
      'pic_finance_phone',
    );
    await this.groupUserService.validateGroupUserUniquePhone(
      createGroupDTO.pic_operational_phone,
      null,
      'pic_operational_phone',
    );
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
    if (createGroupDTO.status == 'ACTIVE')
      create_group.approved_at = new Date();
    if (createGroupDTO.status == 'REJECTED')
      create_group.rejected_at = new Date();
    try {
      const create = await this.groupRepository.save(create_group);
      if (!create) {
        throw new Error('failed insert to merchant_group');
      }
      if (create.status == 'ACTIVE') {
        this.natsService.clientEmit('merchants.group.created', create);
      }

      const specialRoles = await this.roleService.getSpecialRoleByCodes([
        SpecialRoleCodes.corporate_director,
        SpecialRoleCodes.corporate_finance,
        SpecialRoleCodes.corporate_operational,
        SpecialRoleCodes.corporate_director_finance_operational,
        SpecialRoleCodes.corporate_finance_operational,
      ]);

      const array_phone = [];
      create.users = [];
      array_phone.push(createGroupDTO.director_phone);
      const create_director: Partial<GroupUser> = {
        group_id: create.id,
        name: createGroupDTO.director_name,
        phone: createGroupDTO.director_phone,
        email: createGroupDTO.director_email,
        password: createGroupDTO.director_password,
        nip: createGroupDTO.director_nip,
        role_id: _.find(specialRoles, {
          code: SpecialRoleCodes.corporate_director,
        }).role.id,
        status: MerchantUsersStatus.Active,
        is_multilevel_login: createGroupDTO.director_is_multilevel_login,
      };
      // role jika pic_operational & pic_finance sama dengan directur
      if (array_phone.includes(createGroupDTO.pic_operational_phone)) {
        create_director.role_id = _.find(specialRoles, {
          code: SpecialRoleCodes.corporate_director_finance_operational,
        }).role.id;
      }
      const director = await this.groupUserService.createUserPassword(
        create_director,
      );
      create.users.push(director);
      if (!array_phone.includes(createGroupDTO.pic_operational_phone)) {
        array_phone.push(createGroupDTO.pic_operational_phone);
        const create_pic_operational: Partial<GroupUser> = {
          group_id: create.id,
          name: createGroupDTO.pic_operational_name,
          phone: createGroupDTO.pic_operational_phone,
          email: createGroupDTO.pic_operational_email,
          password: createGroupDTO.pic_operational_password,
          nip: createGroupDTO.pic_operational_nip,
          role_id: _.find(specialRoles, {
            code: SpecialRoleCodes.corporate_operational,
          }).role.id,
          status: MerchantUsersStatus.Active,
          is_multilevel_login:
            createGroupDTO.pic_operational_is_multilevel_login,
        };
        // role jika pic_operational & pic_finance sama tetapi berbeda dengan directur
        if (
          createGroupDTO.pic_operational_phone ==
          createGroupDTO.pic_finance_phone
        ) {
          create_director.role_id = _.find(specialRoles, {
            code: SpecialRoleCodes.corporate_finance_operational,
          }).role.id;
        }
        const pic_operational = await this.groupUserService.createUserPassword(
          create_pic_operational,
        );
        create.users.push(pic_operational);
      }
      if (!array_phone.includes(createGroupDTO.pic_finance_phone)) {
        array_phone.push(createGroupDTO.pic_finance_phone);
        const create_pic_finance: Partial<GroupUser> = {
          group_id: create.id,
          name: createGroupDTO.pic_finance_name,
          phone: createGroupDTO.pic_finance_phone,
          email: createGroupDTO.pic_finance_email,
          password: createGroupDTO.pic_finance_password,
          nip: createGroupDTO.pic_finance_nip,
          role_id: _.find(specialRoles, {
            code: SpecialRoleCodes.corporate_finance,
          }).role.id,
          status: MerchantUsersStatus.Active,
          is_multilevel_login: createGroupDTO.pic_finance_is_multilevel_login,
        };
        const pic_finance = await this.groupUserService.createUserPassword(
          create_pic_finance,
        );
        create.users.push(pic_finance);
      }
      deleteCredParam(create);
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
    if (updateGroupDTO.name) {
      await this.validateGroupUniqueName(updateGroupDTO.name, id);
    }
    if (updateGroupDTO.phone) {
      await this.validateGroupUniquePhone(updateGroupDTO.phone, id);
    }
    const group = await this.groupRepository.findOne({
      relations: ['users'],
      where: { id },
    });
    const oldStatus = group.status;
    if (updateGroupDTO.status == 'ACTIVE') group.approved_at = new Date();
    if (updateGroupDTO.status == 'REJECTED') group.rejected_at = new Date();

    Object.assign(group, updateGroupDTO);

    Object.assign(
      group,
      new SetFieldEmptyUtils().apply(group, updateGroupDTO.delete_files),
    );

    const update_group = await this.groupRepository.save(group);
    if (!update_group) {
      throw new Error('Update Failed');
    }

    //Checking Status
    if (updateGroupDTO.status == GroupStatus.Inactive) {
      const updateMerchantData: Partial<MerchantDocument> = {
        status: MerchantStatus.Inactive,
      };
      const criteria: Partial<MerchantDocument> = { group_id: update_group.id };
      const merchants = await this.merchantService.updateMerchantByCriteria(
        criteria,
        updateMerchantData,
      );
      if (merchants && merchants.length > 0) {
        for (const merchant of merchants) {
          await this.storeService.setAllInactiveByMerchantId(merchant.id);
        }
      }
    }
    this.publishNatsUpdateGroup(update_group, oldStatus);
    deleteCredParam(group);
    return group;
  }

  async deleteMerchantGroupProfile(data: string): Promise<any> {
    const cekid = await this.findGroupById(data);
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
        this.natsService.clientEmit('merchants.group.deleted', cekid);
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

  async viewGroupDetail(
    id: string,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    try {
      const gid = user.user_type == 'admin' ? id : user.group_id;
      const result = await this.groupRepository.findOne(gid);

      deleteCredParam(result);

      await this.manipulateGroupUrl(result);

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
    const statuses = data.statuses || [];
    const searchFields = data.search_fields || [];

    const query = this.groupRepository.createQueryBuilder();

    if (search) {
      query.where(
        new Brackets((qb) => {
          if (searchFields.length > 0) {
            for (const searchField of searchFields) {
              if (searchField == SearchFields.Name) {
                qb.orWhere('name ilike :mname', {
                  mname: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.Phone) {
                qb.orWhere('phone ilike :ophone', {
                  ophone: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.Category) {
                qb.orWhere('category::text ilike :category', {
                  category: '%' + search + '%',
                });
              }
            }
          } else {
            qb.where('name ilike :name', { name: '%' + search + '%' });
            qb.orWhere('category::text ilike :cat', {
              cat: '%' + search + '%',
            });
            qb.orWhere('phone ilike :ghp', {
              ghp: '%' + search + '%',
            });
          }
        }),
      );
    }

    if (data.group_category) {
      query.andWhere('category = :gcat', {
        gcat: data.group_category,
      });
    }

    if (data.status) {
      statuses.push(data.status);
    }
    if (statuses.length > 0) {
      query.andWhere('status in (:...mstat)', {
        mstat: statuses,
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

    for (const element of list) {
      deleteCredParam(element);

      await this.manipulateGroupUrl(element);
    }
    return {
      total_item: count,
      limit: Number(perPage),
      current_page: Number(currentPage),
      items: list,
    };
  }

  async getAndValidateGroupByGroupId(group_id: string): Promise<GroupDocument> {
    try {
      const group = await this.groupRepository.findOne({
        where: { id: group_id },
        relations: ['merchants', 'merchants.stores', 'users'],
      });
      if (!group) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: group_id,
              property: 'group_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      return group;
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

  async validateGroupUniqueName(name: string, id?: string) {
    const where: { name: FindOperator<string>; id?: FindOperator<string> } = {
      name: ILike(name),
    };
    if (id) {
      where.id = Not(id);
    }
    const group = await this.groupRepository.findOne({
      where,
    });
    if (group) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: name,
            property: 'name',
            constraint: [this.messageService.get('merchant.general.nameExist')],
          },
          'Bad Request',
        ),
      );
    }
  }

  async validateGroupUniquePhone(phone: string, id?: string) {
    const where: { phone: FindOperator<string>; id?: FindOperator<string> } = {
      phone: ILike(phone),
    };
    if (id) {
      where.id = Not(id);
    }
    const group = await this.groupRepository.findOne({
      where,
    });
    if (group) {
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
  }

  //Publish Payload to Nats
  async publishNatsUpdateGroup(
    payload: GroupDocument,
    oldStatus: GroupStatus = GroupStatus.Active,
  ) {
    await this.manipulateGroupUrl(payload);

    if (payload.status == GroupStatus.Inactive) {
      this.natsService.clientEmit('merchants.group.deleted', payload);
    } else if (
      payload.status == GroupStatus.Active &&
      (oldStatus == GroupStatus.Inactive || oldStatus == GroupStatus.Draft)
    ) {
      this.natsService.clientEmit('merchants.group.created', payload);
    } else if (payload.status == GroupStatus.Active) {
      this.natsService.clientEmit('merchants.group.updated', payload);
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

  async getGroupBufferS3(data: any) {
    try {
      const group = await this.groupRepository.findOne({
        id: data.id,
        [data.doc]: Like(`%${data.fileName}%`),
      });

      if (!group) {
        const errors: RMessage = {
          value: data.id,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
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
      return await this.storage.getImageProperties(group[data.doc]);
    } catch (error) {
      console.error(error);
    }
  }

  async manipulateGroupUrl(group: GroupDocument): Promise<GroupDocument> {
    let filename = null;
    if (isDefined(group)) {
      if (
        isDefined(group.siup_file) &&
        group.siup_file &&
        !group.siup_file.includes('dummyimage')
      ) {
        filename =
          group.siup_file.split('/')[group.siup_file.split('/').length - 1];
        group.siup_file = `${process.env.BASEURL_API}/api/v1/merchants/groups/siup_file/${group.id}/image/${filename}`;
      }

      if (
        isDefined(group.akta_pendirian_file) &&
        group.akta_pendirian_file &&
        !group.akta_pendirian_file.includes('dummyimage')
      ) {
        filename =
          group.akta_pendirian_file.split('/')[
            group.akta_pendirian_file.split('/').length - 1
          ];
        group.akta_pendirian_file = `${process.env.BASEURL_API}/api/v1/merchants/groups/akta_pendirian_file/${group.id}/image/${filename}`;
      }

      if (
        isDefined(group.akta_perubahan_file) &&
        group.akta_perubahan_file &&
        !group.akta_perubahan_file.includes('dummyimage')
      ) {
        filename =
          group.akta_perubahan_file.split('/')[
            group.akta_perubahan_file.split('/').length - 1
          ];
        group.akta_perubahan_file = `${process.env.BASEURL_API}/api/v1/merchants/groups/akta_perubahan_file/${group.id}/image/${filename}`;
      }

      if (
        isDefined(group.npwp_file) &&
        group.npwp_file &&
        !group.npwp_file.includes('dummyimage')
      ) {
        filename =
          group.npwp_file.split('/')[group.npwp_file.split('/').length - 1];
        group.npwp_file = `${process.env.BASEURL_API}/api/v1/merchants/groups/npwp_file/${group.id}/image/${filename}`;
      }

      if (
        isDefined(group.director_id_file) &&
        group.director_id_file &&
        !group.director_id_file.includes('dummyimage')
      ) {
        filename =
          group.director_id_file.split('/')[
            group.director_id_file.split('/').length - 1
          ];
        group.director_id_file = `${process.env.BASEURL_API}/api/v1/merchants/groups/director_id_file/${group.id}/image/${filename}`;
      }

      if (
        isDefined(group.director_id_face_file) &&
        group.director_id_face_file &&
        !group.director_id_face_file.includes('dummyimage')
      ) {
        filename =
          group.director_id_face_file.split('/')[
            group.director_id_face_file.split('/').length - 1
          ];
        group.director_id_face_file = `${process.env.BASEURL_API}/api/v1/merchants/groups/director_id_face_file/${group.id}/image/${filename}`;
      }

      return group;
    }
  }

  async updateUser(
    group: GroupDocument,
    groupUser: Partial<GroupUser>,
    queryRunner: QueryRunner,
    type: string
  ) {
    try {
      console.log(group)
      groupUser.token_reset_password = randomUUID();

    //Cheking Env Bypass Verification
    const bypassEnv = process.env.HERMES_USER_REGISTER_BYPASS;
    const bypassUser = bypassEnv && bypassEnv == 'true' ? true : false;
    if (bypassUser) {
      groupUser.email_verified_at = new Date();
      groupUser.phone_verified_at = new Date();
    }
    // const result = await this.merchantUsersRepository.save(groupUser);
    let phone: string = '';
    if (type === 'director') {
      phone = group.director_phone;
    } else if (type === 'pic_operational') {
      phone = group.pic_operational_phone;
    } else {
      phone = group.pic_finance_phone
    }
    console.log(phone);
    await queryRunner.manager
      .getRepository(MerchantUsersDocument)
      .createQueryBuilder()
      .update()
      .set(groupUser)
      .where('group_id = :group_id', { group_id: group.id })
      .andWhere('phone = :phone', { phone: phone })
      .execute();

    delete groupUser.password;

    const token = groupUser.token_reset_password;

    const urlVerification = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;
    if (process.env.NODE_ENV == 'test') {
      groupUser.token_reset_password = token;
      // result.url = urlVerification;
    }

    // if (!bypassUser) {
    //   const smsMessage = await generateSmsUrlVerification(
    //     groupUser.name,
    //     urlVerification,
    //   );

    //   this.notificationService.sendSms(groupUser.phone, smsMessage);
    // }
    return groupUser;
    } catch (error) {
      console.log(error);
    }
  }

  async updateCorporate(
    group: GroupDocument,
    updateCorporateDto: UpdateCorporateDto
  ) {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if(
        updateCorporateDto.director_password ||
        updateCorporateDto.pic_operational_password ||
        updateCorporateDto.pic_finance_password ||
        updateCorporateDto.pic_password
      ) {
        const salt: string = await this.hashService.randomSalt();
        updateCorporateDto.director_password = await this.hashService.hashPassword(
          updateCorporateDto.director_password,
          salt
        );

        updateCorporateDto.pic_operational_password = await this.hashService.hashPassword(
          updateCorporateDto.pic_operational_password,
          salt
        );

        updateCorporateDto.pic_finance_password = await this.hashService.hashPassword(
          updateCorporateDto.pic_finance_password,
          salt
        );

        updateCorporateDto.pic_password = await this.hashService.hashPassword(
          updateCorporateDto.pic_password,
          salt
        );
      }
      
      const groupData: Partial<GroupDocument> = {
        category: updateCorporateDto.category || group.category,
        name: updateCorporateDto.name || group.name,
        phone: updateCorporateDto.phone || group.phone,
        address: updateCorporateDto.address || group.address,
        siup_no: updateCorporateDto.siup_no || group.siup_no,
        siup_file: updateCorporateDto.siup_file || group.siup_file,
        akta_pendirian_file: updateCorporateDto.akta_pendirian_file || group.akta_pendirian_file,
        npwp_no: updateCorporateDto.npwp_no || group.npwp_no,
        npwp_file: updateCorporateDto.npwp_file || group.npwp_file,
        director_name: updateCorporateDto.director_name || group.director_name,
        director_nip: updateCorporateDto.director_nip || group.director_nip,
        director_phone: updateCorporateDto.director_phone || group.director_phone,
        director_email: updateCorporateDto.director_email || group.director_email,
        director_identity_type: updateCorporateDto.director_identity_type || group.director_identity_type,
        director_id_no: updateCorporateDto.director_id_no || group.director_id_no,
        director_id_file: updateCorporateDto.director_id_file || group.director_id_file,
        director_id_face_file: updateCorporateDto.director_id_face_file || group.director_id_face_file,
        director_is_multilevel_login: updateCorporateDto.director_is_multilevel_login || group.director_is_multilevel_login,
        pic_operational_name: updateCorporateDto.pic_operational_name || group.pic_operational_name,
        pic_operational_nip: updateCorporateDto.pic_operational_nip || group.pic_operational_nip,
        pic_operational_email: updateCorporateDto.pic_operational_email || group.pic_operational_email,
        pic_operational_phone: updateCorporateDto.pic_operational_phone || group.pic_operational_phone,
        pic_operational_password: updateCorporateDto.pic_operational_password || group.pic_operational_password,
        pic_operational_is_multilevel_login: updateCorporateDto.pic_operational_is_multilevel_login || group.pic_operational_is_multilevel_login,
        pic_finance_name: updateCorporateDto.pic_finance_name || group.pic_finance_name,
        pic_finance_nip: updateCorporateDto.pic_finance_nip || group.pic_finance_nip,
        pic_finance_email: updateCorporateDto.pic_finance_email || group.pic_finance_email,
        pic_finance_phone: updateCorporateDto.pic_finance_phone || group.pic_finance_phone,
        pic_finance_password: updateCorporateDto.pic_finance_password || group.pic_finance_password,
        pic_finance_is_multilevel_login: updateCorporateDto.pic_finance_is_multilevel_login || group.pic_finance_is_multilevel_login,
        updated_at: new Date(),
      }

      const executionUpdateGroup = await queryRunner.manager
          .getRepository(GroupDocument)
          .createQueryBuilder()
          .update()
          .set(groupData)
          .where('id = :id', { id: group.id })
          .execute()
      // console.log('id', grou)
      console.log('exec', executionUpdateGroup.affected)
      
      const resultGroup: GroupDocument = executionUpdateGroup.raw[0]
      console.log('resultGroup', resultGroup)

      if (executionUpdateGroup.affected) {
        this.natsService.clientEmit('merchants.group.updated', groupData)
      }

      deleteCredParam(groupData);

      // update director
      if (
        updateCorporateDto.director_name ||
        updateCorporateDto.director_email || 
        updateCorporateDto.director_phone ||
        updateCorporateDto.director_is_multilevel_login ||
        updateCorporateDto.director_password
      ) {
        const directorData: Partial<GroupUser> = {
          group_id: group.id,
          name: updateCorporateDto.director_name,
          phone: updateCorporateDto.director_phone,
          email: updateCorporateDto.director_email,
          password: updateCorporateDto.director_email,
          status: MerchantUsersStatus.Active,
          is_multilevel_login: updateCorporateDto.director_is_multilevel_login
        }
        await this.updateUser(
          group,
          directorData,
          queryRunner,
          'director'
        )
      }

      // update pic operational
      if (
        updateCorporateDto.pic_operational_name ||
        updateCorporateDto.pic_operational_phone || 
        updateCorporateDto.pic_operational_email ||
        updateCorporateDto.pic_operational_is_multilevel_login ||
        updateCorporateDto.pic_operational_password
      ) {
        console.log(updateCorporateDto.pic_operational_name,
          // updateCorporateDto.pic_operational_phone,
          // updateCorporateDto.pic_operational_email,
          // updateCorporateDto.pic_operational_is_multilevel_login,
          // updateCorporateDto.pic_operational_password
          )
        const picOperational: Partial<GroupUser> = {
          group_id: group.id,
          name: updateCorporateDto.pic_operational_name,
          phone: updateCorporateDto.pic_operational_phone,
          email: updateCorporateDto.pic_operational_email,
          password: updateCorporateDto.pic_operational_password,
          status: MerchantUsersStatus.Active,
          is_multilevel_login: updateCorporateDto.pic_operational_is_multilevel_login
        }
        console.log('ops', picOperational)
  
        await this.updateUser(
          group,
          picOperational,
          queryRunner,
          'pic_operational'
        )
      }

      // update pic finance
      if (
        updateCorporateDto.pic_finance_name ||
        updateCorporateDto.pic_finance_phone || 
        updateCorporateDto.pic_finance_email ||
        updateCorporateDto.pic_finance_is_multilevel_login ||
        updateCorporateDto.pic_finance_password
      ) {
        console.log('masuk')
        const picFinance: Partial<GroupUser> = {
          group_id: group.id,
          name: updateCorporateDto.pic_finance_name,
          phone: updateCorporateDto.pic_finance_phone,
          email: updateCorporateDto.pic_finance_email,
          password: updateCorporateDto.pic_finance_password,
          status: MerchantUsersStatus.Active,
          is_multilevel_login: updateCorporateDto.pic_finance_is_multilevel_login
        }
  
        await this.updateUser(
          group,
          picFinance,
          queryRunner,
          'pic_finance'
        )
      }

      if (
        updateCorporateDto.name !==
        group.name
      ) {
        await this.merchantService.validateMerchantUniqueName(
          updateCorporateDto.name,
        );
      }

      if (
        updateCorporateDto.phone !==
        group.phone
      ) {
        await this.merchantService.validateMerchantUniquePhone(
          updateCorporateDto.phone,
        );
      }

      const checkphone: MerchantDocument = await this.merchantRepository.findOne({
        where: { pic_phone: updateCorporateDto.pic_phone }
      })

      if (updateCorporateDto.pic_phone !== checkphone.pic_phone) {
        const errors: RMessage = {
          value: updateCorporateDto.pic_phone,
          property: 'pic_phone',
          constraint: [
            this.messageService.get('merchant.createmerchant.phoneExist'),
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

      if (updateCorporateDto.pic_email) {
        const checkMerchantByEmail: MerchantDocument = await this.merchantRepository.findOne({
          where: { pic_email: updateCorporateDto.pic_email },
        });
        console.log('checkmail', checkMerchantByEmail);
        console.log('pic_email', updateCorporateDto.pic_email)
        const checkPicEmail = checkMerchantByEmail?.pic_email;
        console.log('checkpic', checkPicEmail);
  
        if (
          checkMerchantByEmail &&
          checkMerchantByEmail.pic_email !== updateCorporateDto.pic_email
        ) {
          const errors: RMessage = {
            value: updateCorporateDto.pic_email,
            property: 'pic_email',
            constraint: [
              this.messageService.get('merchant.createmerchant.emailExist'),
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

      const ceklob: LobDocument = await this.lobService.findLobById(
        updateCorporateDto.lob_id,
      );
      if (!ceklob) {
        console.log('ceklob');
        const errors: RMessage = {
          value: updateCorporateDto.lob_id,
          property: 'lob_id',
          constraint: [
            this.messageService.get('merchant.createmerchant.lobid_notfound'),
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

      const pb1 = updateCorporateDto.pb1 == 'true' ? true : false;
      const pic_is_director = updateCorporateDto.pic_is_director == 'true' ? true : false;
      const pic_is_multilevel_login = updateCorporateDto.pic_is_multilevel_login == 'true' ? true : false;
      const updateMerchantData = {
        ...(updateCorporateDto.type && { type: updateCorporateDto.type}),
        ...(updateCorporateDto.name && { name: updateCorporateDto.name}),
        ...(updateCorporateDto.phone && { phone: updateCorporateDto.phone}),
        ...(updateCorporateDto.logo && { logo: updateCorporateDto.logo}),
        ...(updateCorporateDto.profile_store_photo && { profile_store_logo: updateCorporateDto.profile_store_photo}),
        ...(updateCorporateDto.address && { address: updateCorporateDto.address}),
        ...(updateCorporateDto.lob_id && { lob_id: updateCorporateDto.lob_id}),
        ...(updateCorporateDto.pb1 && { pb1: pb1}),
        ...(updateCorporateDto.pb1_tariff && { pb1_tariff: updateCorporateDto.pb1_tariff}),
        ...(updateCorporateDto.npwp_no && { npwp_no: updateCorporateDto.npwp_no}),
        ...(updateCorporateDto.npwp_name && { npwp_name: updateCorporateDto.npwp_name}),
        ...(updateCorporateDto.npwp_file && { npwp_file: updateCorporateDto.npwp_file}),
        ...(updateCorporateDto.is_pos_checkin_enabled && { is_pos_checkin_enabled: updateCorporateDto.is_pos_checkin_enabled}),
        ...(updateCorporateDto.is_pos_endofday_enabled && { is_pos_endofday_enabled: updateCorporateDto.is_pos_endofday_enabled}),
        ...(updateCorporateDto.is_pos_printer_enabled && { is_pos_printer_enabled: updateCorporateDto.is_pos_printer_enabled}),
        ...(updateCorporateDto.is_manual_refund_enabled && { is_manual_refund_enabled: updateCorporateDto.is_manual_refund_enabled}),
        ...(updateCorporateDto.is_pos_rounded_payment && { is_pos_rounded_payment: updateCorporateDto.is_pos_rounded_payment}),
        ...(updateCorporateDto.pic_name && { pic_name: updateCorporateDto.pic_name}),
        ...(updateCorporateDto.pic_nip && { pic_nip: updateCorporateDto.pic_nip}),
        ...(updateCorporateDto.pic_phone && { pic_phone: updateCorporateDto.pic_phone}),
        ...(updateCorporateDto.pic_email && { pic_email: updateCorporateDto.pic_email}),
        ...(updateCorporateDto.pic_password && { pic_password: updateCorporateDto.pic_password}),
        ...(updateCorporateDto.pic_is_multilevel_login && { pic_is_multilevel_login: pic_is_multilevel_login}),
        ...(updateCorporateDto.pic_is_director && { pic_is_director: pic_is_director}),
      }

      const executionUpdateMerchant = await queryRunner.manager
        .getRepository(MerchantDocument)
        .createQueryBuilder()
        .update()
        .set(updateMerchantData)
        .where('group_id = :groupId', { groupId: group.id })
        .execute()

      await queryRunner.commitTransaction();

      return groupData;

    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
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
    } finally {
      await queryRunner.release();
    }
  }
}
