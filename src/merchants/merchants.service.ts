import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isDefined } from 'class-validator';
import { CommonService } from 'src/common/common.service';
import {
  RoleService,
  SpecialRoleCodes,
} from 'src/common/services/admins/role.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import {
  DiscountType,
  MerchantDocument,
  MerchantStatus,
  PromoType,
} from 'src/database/entities/merchant.entity';
// import { Hash } from 'src/hash/hash.decorator';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import { enumStoreStatus } from 'src/database/entities/store.entity';
import { GroupsService } from 'src/groups/groups.service';
import { HashService } from 'src/hash/hash.service';
import { LobService } from 'src/lob/lob.service';
import { MessageService } from 'src/message/message.service';
import { NatsService } from 'src/nats/nats.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { StoresService } from 'src/stores/stores.service';
import {
  deleteCredParam,
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import {
  Brackets,
  FindOperator,
  ILike,
  Like,
  Not,
  Raw,
  Repository,
} from 'typeorm';
import { MerchantUsersService } from './merchants_users.service';
import { CreateMerchantDTO } from './validation/create_merchant.dto';
import {
  ListMerchantDTO,
  SearchFields,
} from './validation/list-merchant.validation';
import { UpdateMerchantDTO } from './validation/update_merchant.dto';
import { SetFieldEmptyUtils } from '../utils/set-field-empty-utils';
@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private merchantUserService: MerchantUsersService,
    private readonly storage: CommonStorageService,
    private readonly commonService: CommonService,
    private readonly groupsService: GroupsService,
    private readonly lobService: LobService,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => StoresService))
    private readonly storesService: StoresService,
    private readonly natsService: NatsService,
  ) {}

  async findMerchantById(id: string): Promise<MerchantDocument> {
    return this.merchantRepository
      .findOne({
        where: { id: id },
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.routine],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      });
  }

  async findMerchantMerchantByPhone(id: string): Promise<MerchantDocument> {
    return this.merchantRepository.findOne({
      where: { pic_phone: id },
    });
  }

  async findMerchantMerchantByEmail(id: string): Promise<MerchantDocument> {
    return this.merchantRepository.findOne({
      where: { pic_email: id },
    });
  }

  async findMerchantsByGroup(group_id: string): Promise<MerchantDocument[]> {
    return this.merchantRepository.find({
      where: { group_id: group_id },
    });
  }

  async createMerchantMerchantProfile(
    data: CreateMerchantDTO,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    const pic_is_director = data.pic_is_director == 'true' ? true : false;
    const pic_is_multilevel_login =
      data.pic_is_multilevel_login == 'true' ? true : false;
    await this.validateMerchantUniqueName(data.name);
    await this.validateMerchantUniquePhone(data.phone);
    const cekphone: MerchantDocument = await this.merchantRepository.findOne({
      where: { pic_phone: data.pic_phone },
    });
    if (cekphone && !pic_is_director) {
      const errors: RMessage = {
        value: data.pic_phone,
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
    const cekemail: MerchantDocument = await this.merchantRepository.findOne({
      where: { pic_email: data.pic_email },
    });
    if (cekemail) {
      const errors: RMessage = {
        value: data.pic_email,
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
    const cekgroup: GroupDocument = await this.groupsService.findGroupById(
      data.group_id,
    );
    if (!cekgroup) {
      const errors: RMessage = {
        value: data.group_id,
        property: 'group_id',
        constraint: [
          this.messageService.get('merchant.createmerchant.groupid_notfound'),
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
    if (
      user.user_type != 'admin' ||
      (user.user_type == 'admin' && cekgroup.status != 'DRAFT')
    ) {
      console.log('masuk');
      if (cekgroup.status != 'ACTIVE') {
        const errors: RMessage = {
          value: data.group_id,
          property: 'group_id',
          constraint: [
            this.messageService.get(
              'merchant.createmerchant.groupid_notactive',
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
      }
    }

    const ceklob: LobDocument = await this.lobService.findLobById(data.lob_id);
    if (!ceklob) {
      console.log('ceklob');
      const errors: RMessage = {
        value: data.lob_id,
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

    console.log('data.pic_is_director:\n', pic_is_director);
    if (!pic_is_director)
      await this.merchantUserService.checkExistEmailPhone(
        data.pic_email,
        data.pic_phone,
        '',
      );

    const salt: string = await this.hashService.randomSalt();
    data.pic_password = await this.hashService.hashPassword(
      data.pic_password,
      salt,
    );
    const pb1 = data.pb1 == 'true' ? true : false;
    const merchantDTO: Partial<MerchantDocument> = {
      group_id: data.group_id,
      type: data.type,
      name: data.name,
      phone: data.phone,
      profile_store_photo: data.profile_store_photo,
      address: data.address,
      lob_id: data.lob_id,
      pb1: pb1,
      pic_name: data.pic_name,
      pic_phone: data.pic_phone,
      pic_email: data.pic_email,
      pic_password: data.pic_password,
      status: data.status,
      pic_is_multilevel_login: pic_is_multilevel_login,
    };

    merchantDTO.logo = data.logo ? data.logo : '';
    merchantDTO.pic_nip = data.pic_nip ? data.pic_nip : '';
    if (pb1) {
      merchantDTO.pb1_tariff = Number(data.pb1_tariff);
      merchantDTO.npwp_no = data.npwp_no;
      merchantDTO.npwp_name = data.npwp_name;
      merchantDTO.npwp_file = data.npwp_file;
    }
    if (merchantDTO.status == 'ACTIVE') merchantDTO.approved_at = new Date();
    if (merchantDTO.status == 'REJECTED') merchantDTO.rejected_at = new Date();

    const createMerchant = this.merchantRepository.create(merchantDTO);
    try {
      const create: MerchantDocument = await this.merchantRepository.save(
        createMerchant,
      );
      this.publishNatsCreateMerchant(
        Object.assign(new MerchantDocument(), create),
      );
      if (!create) {
        throw new Error('failed insert to merchant_group');
      }

      const specialRoles = await this.roleService.getSpecialRoleByCode(
        SpecialRoleCodes.brand_manager,
      );
      const createMerchantUser: Partial<MerchantUsersDocument> = {
        merchant_id: create.id,
        name: createMerchant.pic_name,
        phone: createMerchant.pic_phone,
        email: createMerchant.pic_email,
        password: createMerchant.pic_password,
        nip: createMerchant.pic_nip,
        role_id: specialRoles.role_id,
      };

      switch (merchantDTO.status) {
        case MerchantStatus.Active:
          createMerchantUser.status = MerchantUsersStatus.Active;
          break;
        case MerchantStatus.Inactive:
          createMerchantUser.status = MerchantUsersStatus.Inactive;
          break;
        case MerchantStatus.Waiting_for_approval:
          createMerchantUser.status = MerchantUsersStatus.Waiting_for_approval;
          break;
        case MerchantStatus.Rejected:
          createMerchantUser.status = MerchantUsersStatus.Rejected;
          break;
      }

      console.log('data.pic_is_director:\n', pic_is_director);
      if (!pic_is_director) {
        const result =
          await this.merchantUserService.createMerchantUsersFromMerchant(
            createMerchantUser,
          );
        deleteCredParam(result);
        create.user = result;
        deleteCredParam(create);
      }

      const pclogdata = {
        id: create.id,
      };
      await this.createCatalogs(pclogdata);

      await this.manipulateMerchantUrl(create);
      if (create.group)
        await this.groupsService.manipulateGroupUrl(create.group);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.createmerchant.success'),
        create,
      );
    } catch (error) {
      console.log(error);
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

  //owner_name, email, phone, password
  async updateMerchantMerchantProfile(
    data: UpdateMerchantDTO,
  ): Promise<RSuccessMessage> {
    try {
      const pic_is_director = data.pic_is_director == 'true' ? true : false;
      const pic_is_multilevel_login =
        data.pic_is_multilevel_login == 'true' ? true : false;
      await this.validateMerchantUniqueName(data.name, data.id);
      await this.validateMerchantUniquePhone(data.phone, data.id);
      const existMerchant: MerchantDocument =
        await this.getAndValidateMerchantById(data.id);

      if (data.pic_phone) {
        const cekphone: MerchantDocument =
          await this.findMerchantMerchantByPhone(data.pic_phone);
        if (
          cekphone &&
          cekphone.pic_phone != existMerchant.pic_phone &&
          !pic_is_multilevel_login
        ) {
          const errors: RMessage = {
            value: data.pic_phone,
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
        existMerchant.pic_phone = data.pic_phone;
      }
      if (data.pic_email == '') {
        existMerchant.pic_email = null;
      } else if (data.pic_email) {
        const cekemail: MerchantDocument =
          await this.findMerchantMerchantByEmail(data.pic_email);
        if (cekemail && cekemail.pic_email != existMerchant.pic_email) {
          const errors: RMessage = {
            value: data.pic_email,
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
        existMerchant.pic_email = data.pic_email;
      }
      if (data.type) existMerchant.type = data.type;
      if (data.name) existMerchant.name = data.name;
      if (data.phone) existMerchant.phone = data.phone;
      if (data.logo) existMerchant.logo = data.logo;
      if (data.profile_store_photo)
        existMerchant.profile_store_photo = data.profile_store_photo;
      if (data.address) existMerchant.address = data.address;
      if (data.lob_id) existMerchant.lob_id = data.lob_id;
      if (data.pb1) {
        existMerchant.pb1 = data.pb1 == 'true' ? true : false;
      }
      if (data.npwp_no) existMerchant.npwp_no = data.npwp_no;
      if (data.npwp_name) existMerchant.npwp_name = data.npwp_name;
      if (data.npwp_file) existMerchant.npwp_file = data.npwp_file;
      if (data.pic_name) {
        existMerchant.pic_name = data.pic_name;
      }
      if (data.pic_nip == '') {
        existMerchant.pic_nip = null;
      } else if (data.pic_nip) {
        existMerchant.pic_nip = data.pic_nip;
      }
      if (data.pb1_tariff) {
        existMerchant.pb1_tariff = data.pb1_tariff;
      }
      if (typeof pic_is_multilevel_login != 'undefined') {
        existMerchant.pic_is_multilevel_login = pic_is_multilevel_login;
      }

      if (!pic_is_director && existMerchant.users.length > 0)
        await this.merchantUserService.checkExistEmailPhone(
          data.pic_email,
          data.pic_phone,
          existMerchant.users[0].id,
        );

      if (data.pic_password) {
        const salt: string = await this.hashService.randomSalt();
        data.pic_password = await this.hashService.hashPassword(
          data.pic_password,
          salt,
        );
      }

      const oldStatus = existMerchant.status;
      const oldPhone = existMerchant.phone;
      if (data.status) existMerchant.status = data.status;
      if (existMerchant.status == 'ACTIVE') {
        if (!existMerchant.approved_at) existMerchant.approved_at = new Date();
        this.storesService.setAllStatusWithWaitingForBrandApprovalByMerchantId(
          existMerchant.id,
          enumStoreStatus.active,
        );
        if (
          oldStatus == MerchantStatus.Draft ||
          oldStatus == MerchantStatus.Waiting_for_approval
        ) {
          if (existMerchant.users[0]) {
            if (!pic_is_director) {
              existMerchant.users[0].name = data.pic_name;
              existMerchant.users[0].email = data.pic_email;
              existMerchant.users[0].phone = data.pic_phone;
              if (data.pic_password) {
                existMerchant.users[0].password = data.pic_password;
              }
              existMerchant.users[0].status = MerchantUsersStatus.Active;
            }
          } else {
            const specialRoles = await this.roleService.getSpecialRoleByCode(
              SpecialRoleCodes.brand_manager,
            );
            if (!pic_is_director) {
              console.log(existMerchant, `=> exist merchant`);
              console.log(data, `=> data`);

              const createMerchantUser: Partial<MerchantUsersDocument> = {
                merchant_id: existMerchant.id,
                name: data.pic_name || existMerchant.pic_name,
                phone: data.pic_phone || existMerchant.pic_phone,
                email: data.pic_email || existMerchant.pic_email,
                password: data.pic_password || existMerchant.pic_password,
                nip: data.pic_nip || existMerchant.pic_nip,
                role_id: specialRoles.role_id,
              };

              const result =
                await this.merchantUserService.createMerchantUsersFromMerchant(
                  createMerchantUser,
                );
              deleteCredParam(result);
              existMerchant.user = result;
              deleteCredParam(existMerchant);
            }
          }
        }
      } else if (existMerchant.status == 'REJECTED') {
        existMerchant.rejected_at = new Date();
        this.storesService.setAllStatusWithWaitingForBrandApprovalByMerchantId(
          existMerchant.id,
          enumStoreStatus.rejected,
        );
        if (oldStatus == MerchantStatus.Draft) {
          if (existMerchant.users[0]) {
            if (!pic_is_director) {
              existMerchant.users[0].name = data.pic_name;
              existMerchant.users[0].email = data.pic_email;
              existMerchant.users[0].phone = data.pic_phone;
              if (data.pic_password) {
                existMerchant.users[0].password = data.pic_password;
              }
              existMerchant.users[0].status = MerchantUsersStatus.Rejected;
            }
          } else {
            const specialRoles = await this.roleService.getSpecialRoleByCode(
              SpecialRoleCodes.brand_manager,
            );
            if (!pic_is_director) {
              const createMerchantUser: Partial<MerchantUsersDocument> = {
                merchant_id: existMerchant.id,
                name: data.pic_name,
                phone: data.pic_phone,
                email: data.pic_email,
                password: data.pic_password,
                nip: data.pic_nip,
                role_id: specialRoles.role_id,
                status: MerchantUsersStatus.Active,
              };

              const result =
                await this.merchantUserService.createMerchantUsersFromMerchant(
                  createMerchantUser,
                );
              deleteCredParam(result);
              existMerchant.user = result;
              deleteCredParam(existMerchant);
            }
          }
        }
      }
      if (data.rejection_reason)
        existMerchant.rejection_reason = data.rejection_reason;

      // try {
      Object.assign(
        existMerchant,
        new SetFieldEmptyUtils().apply(existMerchant, data.delete_files),
      );

      const update: MerchantDocument = await this.merchantRepository.save(
        existMerchant,
      );

      if (!update) {
        throw new Error('failed insert to merchant_group');
      }
      this.publishNatsUpdateMerchant(update, oldStatus);
      if (update.status == MerchantStatus.Inactive) {
        this.storesService.setAllInactiveByMerchantId(existMerchant.id);
      }

      if (
        oldStatus == MerchantStatus.Draft &&
        oldPhone != data.pic_phone &&
        !pic_is_director &&
        update.users.length > 0
      ) {
        this.merchantUserService.resendPhoneUser(update.users[0].id);
      }

      formatingAllOutputTime(update);
      removeAllFieldPassword(update);

      await this.manipulateMerchantUrl(update);
      if (update.group)
        await this.groupsService.manipulateGroupUrl(update.group);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.createmerchant.success'),
        update,
      );
    } catch (error) {
      console.log(error);

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

  async deleteMerchantMerchantProfile(data: string): Promise<any> {
    console.log('before here');

    const merchant = await this.getAndValidateMerchantById(data);
    console.log('cek here');

    return this.merchantRepository
      .softDelete(merchant.id)
      .then(async (result) => {
        this.natsService.clientEmit('merchants.merchant.deleted', merchant);
        const user = await this.merchantUsersRepository.findOne({
          merchant_id: data,
        });
        console.log(user, '=> user');

        if (user) {
          await this.merchantUsersRepository.softDelete({
            merchant_id: data,
          });
        }

        return result;
      })
      .catch((err) => {
        console.log(err);

        const errors: RMessage = {
          value: data,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.deletemerchant.invalid_id'),
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
  }

  async viewMerchantDetail(
    id: string,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    let result: MerchantDocument = null;
    try {
      const mid = user.level == 'merchant' ? user.merchant_id : id;
      result = await this.merchantRepository.findOne({
        where: { id: mid },
        relations: ['group'],
      });
    } catch (error) {
      const errors: RMessage = {
        value: '',
        property: 'listmerchant',
        constraint: [this.messageService.get('merchant.listmerchant.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    if (!result) {
      const errors: RMessage = {
        value: id,
        property: 'id',
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

    await this.manipulateMerchantUrl(result);
    await this.groupsService.manipulateGroupUrl(result.group);

    return this.responseService.success(
      true,
      this.messageService.get('merchant.listmerchant.success'),
      result,
    );
  }

  async listGroupMerchant(
    data: ListMerchantDTO,
    user: Record<string, any>,
  ): Promise<Record<string, any>> {
    const search = data.search || '';
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    const statuses = data.statuses || [];
    const searchFields = data.search_fields || [];

    const merchant = this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .leftJoinAndSelect(
        'merchant_merchant.group',
        'mc_group',
        'mc_group.id = merchant_merchant.group_id',
      )
      .where(
        new Brackets((query) => {
          if (searchFields.length > 0) {
            for (const searchField of searchFields) {
              if (searchField == SearchFields.Name) {
                query.orWhere('merchant_merchant.name ilike :mname', {
                  mname: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.Phone) {
                query.orWhere('merchant_merchant.pic_phone ilike :ophone', {
                  ophone: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.CorporateName) {
                query.orWhere('mc_group.name ilike :gname', {
                  gname: '%' + search + '%',
                });
              }
              if (searchField == SearchFields.Type) {
                query.orWhere('merchant_merchant.type = :tipe', {
                  tipe: search,
                });
              }
            }
          } else {
            query
              .where('merchant_merchant.name ilike :mname', {
                mname: '%' + search + '%',
              })
              .orWhere('merchant_merchant.pic_phone ilike :ophone', {
                ophone: '%' + search + '%',
              })
              .orWhere('mc_group.name ilike :gname', {
                gname: '%' + search + '%',
              });
            if (!data.group_category) {
              query.orWhere('mc_group.category::text ilike :gcat', {
                gcat: '%' + search + '%',
              });
            }
          }
        }),
      );

    if (data.group_category) {
      merchant.andWhere('mc_group.category = :gcat', {
        gcat: data.group_category,
      });
    }

    if (data.status) {
      statuses.push(data.status);
    }
    if (statuses.length > 0) {
      merchant.andWhere('merchant_merchant.status in (:...mstat)', {
        mstat: statuses,
      });
    }

    if (user.user_type == 'admin' && data.group_id) {
      merchant.andWhere('mc_group.id = :mid', {
        mid: data.group_id,
      });
    }

    if (user.level == 'merchant') {
      merchant.andWhere('merchant_merchant.id = :mid', {
        mid: user.merchant_id,
      });
    }
    if (user.level == 'group') {
      merchant.andWhere('mc_group.id = :group_id', { group_id: user.group_id });
    }
    merchant
      .orderBy('merchant_merchant.status', 'ASC')
      .skip((Number(currentPage) - 1) * perPage)
      .take(perPage);

    try {
      const totalItems = await merchant.getCount();
      const list = await merchant.getMany();

      for (const element of list) {
        deleteCredParam(element);
        deleteCredParam(element.group);

        await this.manipulateMerchantUrl(element);
        await this.groupsService.manipulateGroupUrl(element.group);
      }

      return {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: list,
      };
    } catch (error) {
      console.log(
        '===========================Start Database error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Database error==================================',
      );
    }
  }

  async createCatalogs(data: Record<string, any>) {
    const pcurl =
      process.env.BASEURL_CATALOGS_SERVICE +
      '/api/v1/internal/catalogs/menus-prices-categories';

    const pcdata = {
      merchant_id: data.id,
      name: 'Kategori 1',
    };

    const scurl =
      process.env.BASEURL_CATALOGS_SERVICE +
      '/api/v1/internal/catalogs/menus-sales-channels';

    const scdata = {
      merchant_id: data.id,
      name: 'eFOOD',
      platform: 'ONLINE',
      status: 'ACTIVE',
    };

    const headers: Record<string, any> = {
      'Content-Type': 'application/json',
    };

    const priceCategory = await this.requestToApi(pcurl, pcdata, headers);

    if (data?.store_id && priceCategory.data?.id) {
      Object.assign(scdata, {
        pricing_templates: [
          {
            store_id: data.store_id,
            category_price_id: priceCategory.data?.id,
          },
        ],
      });
    }

    await this.requestToApi(scurl, scdata, headers);
  }

  async requestToApi(
    url: string,
    data: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<any> {
    const result = await this.commonService.postHttp(url, data, headers);
    const logger = new Logger();
    logger.log(result, 'Reg Catalog Merchant');

    return result;
  }

  async extendValidateImageCreate(
    image: string,
    imageProperty: string,
  ): Promise<string> {
    let imageUrl: string;

    if (image != null && image != '' && typeof image != 'undefined') {
      try {
        imageUrl = await this.storage.store(image);
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: imageProperty,
            constraint: [
              this.messageService.get('merchant.general.empty_photo'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    return imageUrl;
  }

  async extendValidateImageUpdate(
    image: string,
    urlExisting: string,
  ): Promise<string> {
    let imageUrl = '';

    if (image != null && image != '' && typeof image != 'undefined') {
      try {
        imageUrl = await this.storage.store(image);
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    } else {
      imageUrl = urlExisting;
    }
    return imageUrl;
  }

  async getAndValidateMerchantById(
    merchantId: string,
  ): Promise<MerchantDocument> {
    try {
      const cekMerchantId = await this.merchantRepository.findOne({
        where: { id: merchantId },
        relations: ['users', 'group', 'stores'],
      });
      console.log(cekMerchantId);

      if (!cekMerchantId) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: merchantId,
              property: 'merchant_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      return cekMerchantId;
    } catch (error) {
      console.log(error);

      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: merchantId,
            property: 'merchant_id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async getMerchantRelationGroupById(
    merchantId: string,
  ): Promise<MerchantDocument> {
    try {
      const cekMerchantId = await this.merchantRepository.findOne({
        where: { id: merchantId },
        relations: ['group'],
      });
      if (!cekMerchantId) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: merchantId,
              property: 'merchant_id',
              constraint: [
                this.messageService.get('merchant.general.idNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      return cekMerchantId;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: merchantId,
            property: 'merchant_id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async getAndValidateMerchantActiveById(
    merchantId: string,
  ): Promise<MerchantDocument> {
    const merchant = await this.getAndValidateMerchantById(merchantId);
    if (merchant.status != MerchantStatus.Active) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: merchantId,
            property: 'merchant_id',
            constraint: [this.messageService.get('merchant.status.notActive')],
          },
          'Bad Request',
        ),
      );
    }
    return merchant;
  }

  async validateMerchantUniqueName(
    name: string,
    id?: string,
  ): Promise<MerchantDocument> {
    const where: { name: FindOperator<string>; id?: FindOperator<string> } = {
      name: ILike(name),
    };
    if (id) {
      where.id = Not(id);
    }
    const cekMerchantName = await this.merchantRepository.findOne({
      where,
    });
    if (cekMerchantName) {
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
    return cekMerchantName;
  }

  async validateMerchantUniquePhone(phone: string, id?: string) {
    const where: { phone: string; id?: FindOperator<string> } = { phone };
    if (id) {
      where.id = Not(id);
    }
    const cekMerchantPhone = await this.merchantRepository.findOne({
      where,
    });
    if (cekMerchantPhone) {
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
    return cekMerchantPhone;
  }

  //Publish Payload to Nats
  async publishNatsCreateMerchant(createData: MerchantDocument) {
    if (createData.status == MerchantStatus.Active) {
      const merchant = await this.getAndValidateMerchantById(createData.id);
      this.natsService.clientEmit('merchants.merchant.created', merchant);
    }
  }

  publishNatsUpdateMerchant(
    payload: MerchantDocument,
    oldStatus: MerchantStatus = MerchantStatus.Active,
  ) {
    if (payload.status == MerchantStatus.Inactive) {
      this.natsService.clientEmit('merchants.merchant.deleted', payload);
    } else if (
      payload.status == MerchantStatus.Active &&
      (oldStatus == MerchantStatus.Inactive ||
        oldStatus == MerchantStatus.Draft)
    ) {
      this.natsService.clientEmit('merchants.merchant.created', payload);
    } else if (payload.status == MerchantStatus.Active) {
      this.natsService.clientEmit('merchants.merchant.updated', payload);
    }
  }

  async updatePostSettings(data, id) {
    try {
      const result = await this.getAndValidateMerchantById(id);

      if (typeof data.is_pos_checkin_enabled !== 'undefined')
        result.is_pos_checkin_enabled = data.is_pos_checkin_enabled;
      if (typeof data.is_pos_endofday_enabled !== 'undefined')
        result.is_pos_endofday_enabled = data.is_pos_endofday_enabled;
      if (typeof data.is_pos_printer_enabled !== 'undefined')
        result.is_pos_printer_enabled = data.is_pos_printer_enabled;
      if (typeof data.is_manual_refund_enabled !== 'undefined')
        result.is_manual_refund_enabled = data.is_manual_refund_enabled;
      if (typeof data.is_pos_rounded_payment !== 'undefined')
        result.is_pos_rounded_payment = data.is_pos_rounded_payment;

      const update = await this.merchantRepository.save(result);

      this.publishNatsUpdateStatusEndOfDay(update);

      await this.manipulateMerchantUrl(update);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.createmerchant.success'),
        update,
      );
    } catch (error) {
      console.error(error);
    }
  }

  publishNatsUpdateStatusEndOfDay(payload: MerchantDocument) {
    if (payload.is_pos_endofday_enabled == true) {
      this.natsService.clientEmit(
        'merchants.merchant.endofday.enabled',
        payload,
      );
    } else if (payload.is_pos_endofday_enabled == false) {
      this.natsService.clientEmit(
        'merchants.merchant.endofday.disabled',
        payload,
      );
    }
  }

  async updatedRecommendationPromo(data: any) {
    const merchant: MerchantDocument = await this.merchantRepository.findOne(
      data.merchant_id,
    );
    if (merchant) {
      const url = `${process.env.BASEURL_LOYALTIES_SERVICE}/api/v1/internal/loyalties/recommended-promos/${data.merchant_id}`;
      const result: any = await this.commonService.getHttp(url);

      if (result && result.success) {
        const recommendedPromo = result.data;
        if (isDefined(recommendedPromo.recommended_global_promo)) {
          merchant.recommended_promo_type =
            PromoType[recommendedPromo.recommended_global_promo.type];
          merchant.recommended_discount_type =
            DiscountType[
              recommendedPromo.recommended_global_promo.discount_type
            ];
          merchant.recommended_discount_value =
            recommendedPromo.recommended_global_promo.discount_value;
          merchant.recommended_discount_id =
            recommendedPromo.recommended_global_promo.id;
        } else {
          merchant.recommended_promo_type = null;
          merchant.recommended_discount_type = null;
          merchant.recommended_discount_value = null;
          merchant.recommended_discount_id = null;
        }

        if (isDefined(recommendedPromo.recommended_shopping_discount_promo)) {
          merchant.recommended_shopping_discount_type =
            DiscountType[
              recommendedPromo.recommended_shopping_discount_promo.discount_type
            ];
          merchant.recommended_shopping_discount_value =
            recommendedPromo.recommended_shopping_discount_promo.discount_value;
          merchant.recommended_shopping_discount_id =
            recommendedPromo.recommended_shopping_discount_promo.id;
        } else {
          merchant.recommended_shopping_discount_type = null;
          merchant.recommended_shopping_discount_value = null;
          merchant.recommended_shopping_discount_id = null;
        }

        if (isDefined(recommendedPromo.recommended_delivery_discout_promo)) {
          merchant.recommended_delivery_discount_type =
            DiscountType[
              recommendedPromo.recommended_delivery_discout_promo.discount_type
            ];
          merchant.recommended_delivery_discount_value =
            recommendedPromo.recommended_delivery_discout_promo.discount_value;
          merchant.recommended_delivery_discount_id =
            recommendedPromo.recommended_delivery_discout_promo.id;
        } else {
          merchant.recommended_delivery_discount_type = null;
          merchant.recommended_delivery_discount_value = null;
          merchant.recommended_delivery_discount_id = null;
        }

        this.merchantRepository.save(merchant);
      }
    }
  }

  async updateMerchantByCriteria(
    criteria: Partial<MerchantDocument>,
    data: Partial<MerchantDocument>,
  ) {
    try {
      const merchants = await this.merchantRepository.find({
        where: criteria,
      });
      if (!merchants) return null;

      await this.merchantRepository.update(criteria, data);
      return merchants;
    } catch (error) {
      console.error(error);
    }
  }

  async getMerchantBufferS3(data: any) {
    try {
      const merchant = await this.merchantRepository.findOne({
        id: data.id,
        [data.doc]: Like(`%${data.fileName}%`),
      });

      if (!merchant) {
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
      return await this.storage.getImageProperties(merchant[data.doc]);
    } catch (error) {
      console.error(error);
    }
  }

  manipulateMerchantUrl(merchant: MerchantDocument): MerchantDocument {
    if (isDefined(merchant)) {
      if (isDefined(merchant.logo) && merchant.logo) {
        const fileNameLogo =
          merchant.logo.split('/')[merchant.logo.split('/').length - 1];
        merchant.logo = `${process.env.BASEURL_API}/api/v1/merchants/merchants/logo/${merchant.id}/image/${fileNameLogo}`;
      }

      if (
        isDefined(merchant.profile_store_photo) &&
        merchant.profile_store_photo
      ) {
        const fileNameProfile =
          merchant.profile_store_photo.split('/')[
            merchant.profile_store_photo.split('/').length - 1
          ];
        merchant.profile_store_photo = `${process.env.BASEURL_API}/api/v1/merchants/merchants/profile_store_photo/${merchant.id}/image/${fileNameProfile}`;
      }

      if (isDefined(merchant.npwp_file) && merchant.npwp_file) {
        const fileNameNpwp =
          merchant.npwp_file.split('/')[
            merchant.npwp_file.split('/').length - 1
          ];
        merchant.npwp_file = `${process.env.BASEURL_API}/api/v1/merchants/merchants/npwp_file/${merchant.id}/image/${fileNameNpwp}`;
      }

      return merchant;
    }
  }
}
