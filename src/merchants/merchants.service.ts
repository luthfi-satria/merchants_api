import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MerchantDocument,
  MerchantStatus,
} from 'src/database/entities/merchant.entity';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { deleteCredParam } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { CommonService } from 'src/common/common.service';
import { CreateMerchantDTO } from './validation/create_merchant.dto';
import { GroupDocument } from 'src/database/entities/group.entity';
import { GroupsService } from 'src/groups/groups.service';
import { LobService } from 'src/lob/lob.service';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantUsersService } from './merchants_users.service';
import { UpdateMerchantDTO } from './validation/update_merchant.dto';
import { ListMerchantDTO } from './validation/list-merchant.validation';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private merchantUserService: MerchantUsersService,
    private readonly storage: CommonStorageService,
    private readonly commonService: CommonService,
    private readonly groupsService: GroupsService,
    private readonly lobService: LobService,
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

  async createMerchantMerchantProfile(
    data: CreateMerchantDTO,
  ): Promise<RSuccessMessage> {
    const cekphone: MerchantDocument = await this.merchantRepository.findOne({
      where: { pic_phone: data.pic_phone },
    });
    if (cekphone) {
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
    const cekgroup: GroupDocument = await this.groupsService.findMerchantById(
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
    if (cekgroup.status != 'ACTIVE') {
      const errors: RMessage = {
        value: data.group_id,
        property: 'group_id',
        constraint: [
          this.messageService.get('merchant.createmerchant.groupid_notactive'),
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
    const ceklob: LobDocument = await this.lobService.findMerchantById(
      data.lob_id,
    );
    if (!ceklob) {
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

    const createMerchant = this.merchantRepository.create(merchantDTO);
    try {
      const create: Record<string, any> = await this.merchantRepository.save(
        createMerchant,
      );
      if (!create) {
        throw new Error('failed insert to merchant_group');
      }

      const createMerchantUser: Partial<MerchantUsersDocument> = {
        merchant_id: create.id,
        name: createMerchant.pic_name,
        phone: createMerchant.pic_phone,
        email: createMerchant.pic_email,
        password: createMerchant.pic_password,
        nip: createMerchant.pic_nip,
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

      const result =
        await this.merchantUserService.createMerchantUsersFromMerchant(
          createMerchantUser,
        );
      deleteCredParam(result);
      create.user = result;
      deleteCredParam(create);

      const pclogdata = {
        id: create.id,
      };
      await this.createCatalogs(pclogdata);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.createmerchant.success'),
        create,
      );
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

  //owner_name, email, phone, password
  async updateMerchantMerchantProfile(
    data: UpdateMerchantDTO,
  ): Promise<RSuccessMessage> {
    const existMerchant: MerchantDocument =
      await this.merchantRepository.findOne({
        where: { id: data.id },
      });
    if (!existMerchant) {
      const errors: RMessage = {
        value: data.id,
        property: 'id',
        constraint: [this.messageService.get('merchant.updatemerchant.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    let flgUpdateMerchantUser = false;
    if (data.pic_phone) {
      const cekphone: MerchantDocument = await this.findMerchantMerchantByPhone(
        data.pic_phone,
      );
      if (cekphone && cekphone.pic_phone != existMerchant.pic_phone) {
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
      flgUpdateMerchantUser = true;
      existMerchant.pic_phone = data.pic_phone;
    }
    if (data.pic_email) {
      const cekemail: MerchantDocument = await this.findMerchantMerchantByEmail(
        data.pic_email,
      );
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
      flgUpdateMerchantUser = true;
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
      flgUpdateMerchantUser = true;
    }
    if (data.pic_nip) {
      existMerchant.pic_nip = data.pic_nip;
      flgUpdateMerchantUser = true;
    }
    if (data.status) existMerchant.status = data.status;
    if (existMerchant.status == 'ACTIVE')
      existMerchant.approved_at = new Date();

    try {
      const update: Record<string, any> = await this.merchantRepository.save(
        existMerchant,
      );
      if (!update) {
        throw new Error('failed insert to merchant_group');
      }
      update.user = {};
      if (flgUpdateMerchantUser) {
        const updateMerchantUser: Partial<MerchantUsersDocument> = {
          merchant_id: existMerchant.id,
          name: existMerchant.pic_name,
          phone: existMerchant.pic_phone,
          email: existMerchant.pic_email,
          nip: existMerchant.pic_nip,
        };

        switch (existMerchant.status) {
          case MerchantStatus.Active:
            updateMerchantUser.status = MerchantUsersStatus.Active;
            break;
          case MerchantStatus.Inactive:
            updateMerchantUser.status = MerchantUsersStatus.Inactive;
            break;
          case MerchantStatus.Waiting_for_approval:
            updateMerchantUser.status =
              MerchantUsersStatus.Waiting_for_approval;
            break;
          case MerchantStatus.Rejected:
            updateMerchantUser.status = MerchantUsersStatus.Rejected;
            break;
        }

        const result =
          await this.merchantUserService.updateMerchantUsersFromMerchant(
            updateMerchantUser,
          );
        deleteCredParam(result);
        update.user = result;
      }
      deleteCredParam(update);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.createmerchant.success'),
        update,
      );
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

  async deleteMerchantMerchantProfile(data: string): Promise<any> {
    const delete_merchant: Partial<MerchantDocument> = {
      id: data,
    };
    return this.merchantRepository
      .softDelete(delete_merchant)
      .then(() => {
        return this.merchantUsersRepository.softDelete({ merchant_id: data });
      })
      .catch(() => {
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
    try {
      const mid = user.level == 'merchant' ? user.merchant_id : id;
      const result = await this.merchantRepository.findOne({
        where: { id: mid },
        relations: ['group'],
      });
      return this.responseService.success(
        true,
        this.messageService.get('merchant.listmerchant.success'),
        result,
      );
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
  }

  async listGroupMerchant(
    data: ListMerchantDTO,
    user: Record<string, any>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    const statuses = data.statuses || [];

    const merchant = this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .leftJoinAndSelect(
        'merchant_merchant.group',
        'mc_group',
        'mc_group.id = merchant_merchant.group_id',
      )
      .where(
        new Brackets((query) => {
          query
            .where('merchant_merchant.name ilike :mname', {
              mname: '%' + search + '%',
            })
            .orWhere('merchant_merchant.address ilike :addr', {
              addr: '%' + search + '%',
            })
            .orWhere('merchant_merchant.pic_name ilike :oname', {
              oname: '%' + search + '%',
            })
            .orWhere('merchant_merchant.pic_email ilike :omail', {
              omail: '%' + search + '%',
            })
            .orWhere('merchant_merchant.pic_phone ilike :ophone', {
              ophone: '%' + search + '%',
            })
            .orWhere('merchant_merchant.pic_nip ilike :onik', {
              onik: '%' + search + '%',
            });
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
      .orderBy('merchant_merchant.created_at', 'ASC')
      .offset((Number(currentPage) - 1) * perPage)
      .limit(perPage);

    try {
      const totalItems = await merchant.getCount();
      const list = await merchant.getMany();
      list.forEach((element) => {
        deleteCredParam(element);
        deleteCredParam(element.group);
      });

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
      '/api/v1/internal/menus-prices-categories';
    const pcdata = {
      merchant_id: data.id,
      name: 'Kategori 1',
    };
    const scurl =
      process.env.BASEURL_CATALOGS_SERVICE +
      '/api/v1/internal/menus-sales-channels';
    const scdata = {
      merchant_id: data.id,
      name: 'EFOOD',
      platform: 'ONLINE',
    };
    const headers: Record<string, any> = {
      'Content-Type': 'application/json',
    };

    await this.requestToApi(pcurl, pcdata, headers);
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
}
