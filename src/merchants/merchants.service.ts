import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { deleteCredParam } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { CommonService } from 'src/common/common.service';
import { CreateMerchantDTO } from './validation/create_merchant.dto';
import { GroupDocument } from 'src/database/entities/group.entity';
import { GroupsService } from 'src/groups/groups.service';
import { LobService } from 'src/lob/lob.service';
import { LobDocument } from 'src/database/entities/lob.entity';
import { MerchantUsersService } from './merchants_users.service';
import { MerchantUser } from './interface/merchant_user.interface';
import { UpdateMerchantDTO } from './validation/update_merchant.dto';

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
    return await this.merchantRepository
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
    return await this.merchantRepository.findOne({
      where: { pic_phone: id },
    });
  }

  async findMerchantMerchantByEmail(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
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

    const createMerchant = this.merchantRepository.create(merchantDTO);
    try {
      const create: Record<string, any> = await this.merchantRepository.save(
        createMerchant,
      );
      if (!create) {
        throw new Error('failed insert to merchant_group');
      }

      const createMerchantUser: Partial<MerchantUser> = {
        merchant_id: create.id,
        name: createMerchant.pic_name,
        phone: createMerchant.pic_phone,
        email: createMerchant.pic_email,
        password: createMerchant.pic_password,
        nip: createMerchant.pic_nip,
      };

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

    try {
      const update: Record<string, any> = await this.merchantRepository.save(
        existMerchant,
      );
      if (!update) {
        throw new Error('failed insert to merchant_group');
      }
      update.user = {};
      if (flgUpdateMerchantUser) {
        const updateMerchantUser: Partial<MerchantUser> = {
          merchant_id: existMerchant.id,
          name: existMerchant.pic_name,
          phone: existMerchant.pic_phone,
          email: existMerchant.pic_email,
          nip: existMerchant.pic_nip,
        };

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
    //   //   try {
    //   //     const url = await this.storage.store(data.owner_ktp);
    //   //     merchantExist.owner_ktp = url;
    //   //   } catch (e) {
    //   //     console.error(e);
    //   //     throw new InternalServerErrorException(e.message);
    //   //   }
    //   // }
    //   // if (
    //   //   data.owner_face_ktp != null &&
    //   //   data.owner_face_ktp != '' &&
    //   //   typeof data.owner_face_ktp != 'undefined'
    //   // ) {
    //   //   try {
    //   //     const url = await this.storage.store(data.owner_face_ktp);
    //   //     merchantExist.owner_face_ktp = url;
    //   //   } catch (e) {
    //   //     console.error(e);
    //   //     throw new InternalServerErrorException(e.message);
    //   //   }
    //   // }
    //   merchantExist.owner_ktp = await this.extendValidateImageUpdate(
    //     data.owner_ktp,
    //     merchantExist.owner_ktp,
    //   );
    //   merchantExist.owner_face_ktp = await this.extendValidateImageUpdate(
    //     data.owner_face_ktp,
    //     merchantExist.owner_face_ktp,
    //   );
    //   merchantExist.logo = await this.extendValidateImageUpdate(
    //     data.logo,
    //     merchantExist.logo,
    //   );
    //   return await this.merchantRepository
    //     .save(merchantExist)
    //     // .createQueryBuilder('merchant_merchant')
    //     // .update(MerchantDocument)
    //     // .set(merchantExist)
    //     // .where('id= :id', { id: data.id })
    //     // .returning('*')
    //     // .execute()
    //     .then(async (response) => {
    //       dbOutputTime(response);
    //       await this.merchantUsersRepository
    //         .createQueryBuilder('merchant_users')
    //         .update(MerchantUsersDocument)
    //         .set(updateMUsers)
    //         .where('merchant_id= :gid', { gid: data.id })
    //         .execute();
    //       delete response.owner_password;
    //       return response;
    //     })
    //     .catch((err) => {
    //       const errors: RMessage = {
    //         value: '',
    //         property: err.column,
    //         constraint: [err.message],
    //       };
    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           errors,
    //           'Bad Request',
    //         ),
    //       );
    //     });
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

  async listGroupMerchant(
    data: Record<string, any>,
    group_id: string,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;

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
          // .orWhere('merchant_merchant.pb1_tariff ilike :tpb', {
          //   tpb: '%' + search + '%',
          // });
        }),
      );
    if (group_id) {
      merchant.andWhere('group_id = :group_id', { group_id });
    }
    merchant
      .orderBy('merchant_merchant.created_at', 'DESC')
      .offset((currentPage - 1) * perPage)
      .limit(perPage);

    try {
      const totalItems = await merchant.getCount();
      const list = await merchant.getMany();
      list.map((element) => {
        let output = deleteCredParam(element); // dbOutputTime(element);
        output = deleteCredParam(element.group);
        // output.owner_dob = moment(element.owner_dob).format('YYYY-MM-DD');
        // delete output.owner_password;
        return output;
      });

      const list_result: ListResponse = {
        total_item: totalItems,
        limit: Number(perPage),
        current_page: Number(currentPage),
        items: list,
      };
      return list_result;
    } catch (error) {
      console.log(
        '===========================Start Database error=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        error,
        '\n============================End Database error==================================',
      );
    }

    // return await this.merchantRepository
    //   .createQueryBuilder('merchant_merchant')
    //   .select('*')
    //   .orWhere('lower(name) like :mname', {
    //     mname: '%' + search + '%',
    //   })
    //   .orWhere('lower(address) like :addr', {
    //     addr: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_name) like :oname', {
    //     oname: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_email) like :omail', {
    //     omail: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_phone) like :ophone', {
    //     ophone: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_password) like :opass', {
    //     opass: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_nik) like :onik', {
    //     onik: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_dob_city) like :odc', {
    //     odc: '%' + search + '%',
    //   })
    //   .orWhere('lower(owner_address) like :oaddr', {
    //     oaddr: '%' + search + '%',
    //   })
    //   .orWhere('lower(bank_acc_name) like :ban', {
    //     ban: '%' + search + '%',
    //   })
    //   .orWhere('lower(bank_acc_number) like :banu', {
    //     banu: '%' + search + '%',
    //   })
    //   .orWhere('lower(tarif_pb1) like :tpb', {
    //     tpb: '%' + search + '%',
    //   })
    //   .getCount()
    //   .then(async (counts) => {
    //     totalItems = counts;
    //     return await this.merchantRepository
    //       .createQueryBuilder('merchant_merchant')
    //       .select('*')
    //       .where('lower(name) like :mname', {
    //         mname: '%' + search + '%',
    //       })
    //       .orWhere('lower(address) like :addr', {
    //         addr: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_name) like :oname', {
    //         oname: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_email) like :omail', {
    //         omail: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_phone) like :ophone', {
    //         ophone: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_password) like :opass', {
    //         opass: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_nik) like :onik', {
    //         onik: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_dob_city) like :odc', {
    //         odc: '%' + search + '%',
    //       })
    //       .orWhere('lower(owner_address) like :oaddr', {
    //         oaddr: '%' + search + '%',
    //       })
    //       .orWhere('lower(bank_acc_name) like :ban', {
    //         ban: '%' + search + '%',
    //       })
    //       .orWhere('lower(bank_acc_number) like :banu', {
    //         banu: '%' + search + '%',
    //       })
    //       .orWhere('lower(tarif_pb1) like :tpb', {
    //         tpb: '%' + search + '%',
    //       })
    //       .orderBy('created_at', 'DESC')
    //       .offset((currentPage - 1) * perPage)
    //       .limit(perPage)
    //       .getRawMany();
    //   })
    //   .then((result) => {
    //     result.forEach((row) => {
    //       dbOutputTime(row);
    //       row.owner_dob = moment(row.owner_dob).format('YYYY-MM DD');
    //       delete row.owner_password;
    //     });

    //     const list_result: ListResponse = {
    //       total_item: totalItems,
    //       limit: Number(perPage),
    //       current_page: Number(currentPage),
    //       items: result,
    //     };
    //     return list_result;
    //   })
    //   .catch((err) => {
    //     const errors: RMessage = {
    //       value: '',
    //       property: '',
    //       constraint: [err.message],
    //     };
    //     throw new BadRequestException(
    //       this.responseService.error(
    //         HttpStatus.BAD_REQUEST,
    //         errors,
    //         'Bad Request',
    //       ),
    //     );
    //   });
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
