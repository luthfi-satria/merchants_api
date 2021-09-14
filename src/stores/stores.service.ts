import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { AddonsService } from 'src/addons/addons.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import {
  enumDeliveryType,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { Brackets, Connection, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { StoreOperationalService } from './stores-operational.service';
import { UpdateStoreCategoriesValidation } from './validation/update-store-categories.validation';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly addonService: AddonsService,
    private httpService: HttpService,
    private readonly merchantService: MerchantsService,
    @Hash() private readonly hashService: HashService,
    private readonly storage: CommonStorageService,
    private readonly storeOperationalService: StoreOperationalService,
    @InjectRepository(StoreCategoriesDocument)
    private readonly storeCategoriesRepository: Repository<StoreCategoriesDocument>,
    private readonly connection: Connection,
  ) {}

  createInstance(data: StoreDocument): StoreDocument {
    return this.storeRepository.create(data);
  }

  async findMerchantById(id: string): Promise<StoreDocument> {
    return await this.storeRepository
      .findOne({
        where: { id: id },
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.message],
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

  async findMerchantStoreByPhone(hp: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { owner_phone: hp },
    });
  }

  async findMerchantStoreByEmail(email: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne({
      where: { owner_email: email },
    });
  }

  async getMerchantStoreDetailById(id: string): Promise<StoreDocument> {
    return await this.storeRepository.findOne(id, {
      relations: ['operational_hours', 'service_addon'],
    });
  }

  async createMerchantStoreProfile(
    data: Record<string, any>,
  ): Promise<StoreDocument> {
    let validAddonId = true;
    let valueAddonId;
    const listAddon: AddonDocument[] = [];
    if (
      typeof data.service_addon != 'undefined' &&
      data.service_addon.length > 0
    ) {
      for (const addonId of data.service_addon) {
        const cekAddonID = await this.addonService.findAddonById(addonId);
        if (!cekAddonID) {
          validAddonId = false;
          valueAddonId = addonId;
          break;
        }
        dbOutputTime(cekAddonID);
        listAddon.push(cekAddonID);
      }
      if (!validAddonId) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: valueAddonId,
              property: 'service_addon',
              constraint: [
                this.messageService.get('merchant.createstore.addonid_unreg'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      data.owner_password,
      salt,
    );

    const create_store: Partial<StoreDocument> = {
      merchant_id: data.merchant_id,
      name: data.name,
      phone: data.phone,
      owner_phone: data.owner_phone,
      owner_email: data.owner_email,
      owner_password: passwordHash,
      address: data.address,
      post_code: data.post_code,
      guidance: data.guidance,
      location_longitude: data.location_longitude,
      location_latitude: data.location_latitude,
      service_addon: listAddon,
      upload_photo: data.upload_photo,
      upload_banner: data.upload_banner,
      delivery_type: data.delivery_type,
      gmt_offset: data.gmt_offset,
    };

    if (
      data.upload_photo != null &&
      data.upload_photo != '' &&
      typeof data.upload_photo != 'undefined'
    ) {
      try {
        const url = await this.storage.store(data.upload_photo);
        create_store.upload_photo = url;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }

    if (
      data.upload_banner != null &&
      data.upload_banner != '' &&
      typeof data.upload_banner != 'undefined'
    ) {
      try {
        const url = await this.storage.store(data.upload_banner);
        create_store.upload_banner = url;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }

    return await this.storeRepository
      .save(create_store)
      .then(async (result) => {
        dbOutputTime(result);
        const mUsers: Partial<MerchantUsersDocument> = {
          name: result.name,
          email: result.owner_email,
          phone: result.owner_phone,
          password: result.owner_password,
          store_id: result.id,
        };
        await this.merchantUsersRepository.save(mUsers);

        delete result.owner_password;
        result.service_addon.forEach((sao) => {
          delete sao.created_at;
          delete sao.updated_at;
        });

        // create default store operational hours
        result.operational_hours = await this.storeOperationalService
          .createStoreOperationalHours(result.id)
          .catch((e) => {
            throw e;
          });

        return result;
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

  // partial update
  async updateStoreProfile(data: StoreDocument) {
    try {
      return await this.storeRepository.update(data.id, data).catch((e) => {
        throw e;
      });
    } catch (e) {
      throw e;
    }
  }

  async updateMerchantStoreProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const updateMUsers: Partial<MerchantUsersDocument> = {};
    const store_exist: StoreDocument = await this.storeRepository
      .findOne(data.id, {
        relations: ['service_addon', 'operational_hours'],
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.id,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.updatestore.id_notfound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!store_exist) {
      const errors: RMessage = {
        value: data.id,
        property: 'id',
        constraint: [
          this.messageService.get('merchant.updatestore.id_notfound'),
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
      data.service_addon != null &&
      data.service_addon != '' &&
      typeof data.service_addon != 'undefined'
    ) {
      let validAddonId = true;
      let valueAddonId;
      const listAddon: AddonDocument[] = [];
      for (const addonId of data.service_addon) {
        const cekAddonID = await this.addonService
          .findAddonById(addonId)
          .catch(() => {
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                {
                  value: addonId,
                  property: 'service_addon',
                  constraint: [
                    this.messageService.get(
                      'merchant.createstore.addonid_unreg',
                    ),
                  ],
                },
                'Bad Request',
              ),
            );
          });
        if (!cekAddonID) {
          validAddonId = false;
          valueAddonId = addonId;
          break;
        }
        dbOutputTime(cekAddonID);
        listAddon.push(cekAddonID);
      }

      if (!validAddonId) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: valueAddonId,
              property: 'service_addon',
              constraint: [
                this.messageService.get('merchant.createstore.addonid_unreg'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      store_exist.service_addon = listAddon;
    }

    if (
      data.merchant_id != null &&
      data.merchant_id != '' &&
      typeof data.merchant_id != 'undefined'
    ) {
      const cekmerchant: MerchantDocument =
        await this.merchantService.findMerchantById(data.merchant_id);
      if (!cekmerchant) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.merchant_id,
              property: 'merchant_id',
              constraint: [
                this.messageService.get(
                  'merchant.createstore.merchantid_notfound',
                ),
              ],
            },
            'Bad Request',
          ),
        );
      }
      if (cekmerchant.status != 'ACTIVE') {
        const errors: RMessage = {
          value: data.merchant_id,
          property: 'merchant_id',
          constraint: [
            this.messageService.get(
              'merchant.createstore.merchantid_notactive',
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
      store_exist.merchant_id = data.merchant_id;
    }

    if (
      data.name != null &&
      data.name != '' &&
      typeof data.name != 'undefined'
    ) {
      store_exist.name = data.name;
      updateMUsers.name = data.name;
    }
    if (
      data.phone != null &&
      data.phone != '' &&
      typeof data.phone != 'undefined'
    )
      store_exist.phone = data.phone;

    if (
      data.owner_phone != null &&
      data.owner_phone != '' &&
      typeof data.owner_phone != 'undefined'
    ) {
      const cekphone: StoreDocument = await this.findMerchantStoreByPhone(
        data.owner_phone,
      );

      if (cekphone && cekphone.owner_phone != store_exist.owner_phone) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.owner_phone,
              property: 'owner_phone',
              constraint: [
                this.messageService.get('merchant.createstore.phoneExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      store_exist.owner_phone = data.owner_phone;
      updateMUsers.phone = data.owner_phone;
    }

    if (
      data.owner_email != null &&
      data.owner_email != '' &&
      typeof data.owner_email != 'undefined'
    ) {
      const cekemail: StoreDocument = await this.findMerchantStoreByEmail(
        data.owner_email,
      );

      if (cekemail && cekemail.owner_email != store_exist.owner_email) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.owner_email,
              property: 'owner_email',
              constraint: [
                this.messageService.get('merchant.createstore.emailExist'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      store_exist.owner_email = data.owner_email;
      updateMUsers.email = data.owner_email;
    }

    if (
      data.owner_password != null &&
      data.owner_password != '' &&
      typeof data.owner_password != 'undefined'
    ) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        data.owner_password,
        salt,
      );
      store_exist.owner_password = passwordHash;
      updateMUsers.password = passwordHash;
    }
    if (
      data.address != null &&
      data.address != '' &&
      typeof data.address != 'undefined'
    )
      store_exist.address = data.address;
    if (
      data.post_code != null &&
      data.post_code != '' &&
      typeof data.post_code != 'undefined'
    )
      store_exist.post_code = data.post_code;
    if (
      data.guidance != null &&
      data.guidance != '' &&
      typeof data.guidance != 'undefined'
    )
      store_exist.guidance = data.guidance;
    if (
      data.location_longitude != null &&
      data.location_longitude != '' &&
      typeof data.location_longitude != 'undefined'
    )
      store_exist.location_longitude = data.location_longitude;
    if (
      data.location_latitude != null &&
      data.location_latitude != '' &&
      typeof data.location_latitude != 'undefined'
    )
      store_exist.location_latitude = data.location_latitude;

    if (
      data.upload_photo != null &&
      data.upload_photo != '' &&
      typeof data.upload_photo != 'undefined'
    ) {
      try {
        const url = await this.storage.store(data.upload_photo);
        store_exist.upload_photo = url;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }

    if (
      data.upload_banner != null &&
      data.upload_banner != '' &&
      typeof data.upload_banner != 'undefined'
    ) {
      try {
        const url = await this.storage.store(data.upload_banner);
        store_exist.upload_banner = url;
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException(e.message);
      }
    }

    if (data.delivery_type != null && data.delivery_type != '') {
      const deliveryType =
        data.delivery_type == enumDeliveryType.delivery_only
          ? enumDeliveryType.delivery_only
          : enumDeliveryType.delivery_and_pickup;

      store_exist.delivery_type = deliveryType;
    }

    if (data.status != null && data.status != '') {
      store_exist.status = data.status;
    }

    return await this.storeRepository
      .save(store_exist)
      .then(async (result) => {
        dbOutputTime(result);
        await this.merchantUsersRepository
          .createQueryBuilder('merchant_users')
          .update(MerchantUsersDocument)
          .set(updateMUsers)
          .where('store_id= :gid', { gid: data.id })
          .execute();
        delete result.owner_password;
        result.service_addon.forEach((sao) => {
          delete sao.created_at;
          delete sao.updated_at;
        });
        return result;
      })
      .catch((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: '',
              constraint: [err.routine],
            },
            'Bad Request',
          ),
        );
      });
  }

  async deleteMerchantStoreProfile(data: string): Promise<any> {
    const delete_merchant: Partial<StoreDocument> = {
      id: data,
    };
    return this.storeRepository
      .softDelete(delete_merchant)
      .then(() => {
        return this.merchantUsersRepository.softDelete({ store_id: data });
      })
      .catch(() => {
        const errors: RMessage = {
          value: data,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.deletestore.invalid_id'),
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

  async listGroupStore(
    data: Record<string, any>,
    param_usertype: Record<string, string>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    // let totalItems: number;

    const store = this.storeRepository
      .createQueryBuilder('merchant_store')
      .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon');
    if (search) {
      store.andWhere(
        new Brackets((qb) => {
          qb.where('lower(merchant_store.name) like :mname', {
            mname: '%' + search + '%',
          });
          qb.orWhere('lower(merchant_store.phone) like :sname', {
            sname: '%' + search + '%',
          });
          qb.orWhere('lower(merchant_store.owner_phone) like :shp', {
            shp: '%' + search + '%',
          });
          qb.orWhere('lower(merchant_store.owner_email) like :smail', {
            smail: '%' + search + '%',
          });
          qb.orWhere('lower(merchant_store.address) like :astrore', {
            astrore: '%' + search + '%',
          });
          qb.orWhere('lower(merchant_store.post_code) like :pcode', {
            pcode: '%' + search + '%',
          });
          qb.orWhere('lower(merchant_store.guidance) like :guidance', {
            guidance: '%' + search + '%',
          });
        }),
      );
    }

    if (param_usertype.user_type && param_usertype.user_type == 'merchant') {
      store.andWhere('merchant_store.merchant_id = :mid', {
        mid: param_usertype.id,
      });
    } else if (
      param_usertype.user_type &&
      param_usertype.user_type == 'group'
    ) {
      store
        .innerJoin('merchant_store.merchant', 'merchant')
        .andWhere('merchant.group_id = :group_id', {
          group_id: param_usertype.id,
        });
    }
    store
      .orderBy('merchant_store.created_at', 'ASC')
      .offset((currentPage - 1) * perPage)
      .limit(perPage);

    try {
      const totalItems = await store.getCount();
      const list = await store.getMany();
      list.map((element) => {
        const row = dbOutputTime(element);
        delete row.owner_password;
        row.service_addon.forEach((sao) => {
          delete sao.created_at;
          delete sao.updated_at;
        });
        return row;
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

    // if (merchant.user_type == 'merchant') {
    //   return await this.storeRepository
    //     .createQueryBuilder('merchant_store')
    //     .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
    //     .leftJoinAndSelect(
    //       'merchant_store.operational_hours',
    //       'operational_hours',
    //       'operational_hours.merchant_store_id = merchant_store.id',
    //     )
    //     .where('merchant_store.is_store_open = :is_open', { is_open: true })
    //     .andWhere(
    //       new Brackets((qb) => {
    //         qb.where(':currTime >= operational_hours.open_hour', {
    //           currTime: currTime,
    //         });
    //         qb.andWhere(':currTime < operational_hours.close_hour', {
    //           currTime: currTime,
    //         });
    //         qb.andWhere('operational_hours.day_of_week = :weekOfDay', {
    //           weekOfDay: weekOfDay,
    //         });
    //       }),
    //     )
    //     .andWhere(
    //       new Brackets((qb) => {
    //         qb.where('(lower(merchant_store.name) like :mname', {
    //           mname: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.phone) like :sname', {
    //           sname: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.owner_phone) like :shp', {
    //           shp: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.owner_email) like :smail', {
    //           smail: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.address) like :astrore', {
    //           astrore: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.post_code) like :pcode', {
    //           pcode: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.guidance) like :guidance', {
    //           guidance: '%' + search + '%',
    //         });
    //         // .orWhere('merchant_store.location_longitude = :long', {
    //         //   long: search,
    //         // })
    //         // .orWhere('merchant_store.location_latitude = :lat)', {
    //         //   lat: search,
    //         // })
    //       }),
    //     )
    //     .andWhere('merchant_store.merchant_id = :mid', { mid: merchant.id })
    //     .getCount()
    //     .then(async (counts) => {
    //       totalItems = counts;
    //       return await this.storeRepository
    //         .createQueryBuilder('merchant_store')
    //         .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
    //         .leftJoinAndSelect(
    //           'merchant_store.operational_hours',
    //           'operational_hours',
    //           'operational_hours.merchant_store_id = merchant_store.id',
    //         )
    //         .where('merchant_store.is_store_open = :is_open', { is_open: true })
    //         .andWhere(
    //           new Brackets((qb) => {
    //             qb.where(':currTime >= operational_hours.open_hour', {
    //               currTime: currTime,
    //             });
    //             qb.andWhere(':currTime < operational_hours.close_hour', {
    //               currTime: currTime,
    //             });
    //             qb.andWhere('operational_hours.day_of_week = :weekOfDay', {
    //               weekOfDay: weekOfDay,
    //             });
    //           }),
    //         )
    //         .andWhere(
    //           new Brackets((qb) => {
    //             qb.where('(lower(merchant_store.name) like :mname', {
    //               mname: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.phone) like :sname', {
    //               sname: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.owner_phone) like :shp', {
    //               shp: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.owner_email) like :smail', {
    //               smail: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.address) like :astrore', {
    //               astrore: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.post_code) like :pcode', {
    //               pcode: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.guidance) like :guidance', {
    //               guidance: '%' + search + '%',
    //             });
    //             // .orWhere('merchant_store.location_longitude = :long', {
    //             //   long: search,
    //             // })
    //             // .orWhere('merchant_store.location_latitude = :lat)', {
    //             //   lat: search,
    //             // })
    //           }),
    //         )
    //         .andWhere('merchant_store.merchant_id = :mid', { mid: merchant.id })
    //         .orderBy('merchant_store.created_at', 'DESC')
    //         .offset((currentPage - 1) * perPage)
    //         .limit(perPage)
    //         .getMany();
    //     })
    //     .then((result) => {
    //       result.forEach((row) => {
    //         dbOutputTime(row);
    //         delete row.owner_password;
    //         row.service_addon.forEach((sao) => {
    //           delete sao.created_at;
    //           delete sao.updated_at;
    //         });
    //       });
    //       const list_result: ListResponse = {
    //         total_item: totalItems,
    //         limit: Number(perPage),
    //         current_page: Number(currentPage),
    //         items: result,
    //       };
    //       return list_result;
    //     })
    //     .catch((err) => {
    //       const errors: RMessage = {
    //         value: '',
    //         property: '',
    //         constraint: [
    //           this.messageService.getjson({
    //             code: 'DB_ERROR',
    //             message: err.message,
    //           }),
    //         ],
    //       };
    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           errors,
    //           'Bad Request',
    //         ),
    //       );
    //     });
    // } else {
    //   return await this.storeRepository
    //     .createQueryBuilder('merchant_store')
    //     .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
    //     .leftJoinAndSelect(
    //       'merchant_store.operational_hours',
    //       'operational_hours',
    //       'operational_hours.merchant_store_id = merchant_store.id',
    //     )
    //     .where('merchant_store.is_store_open = :is_open', { is_open: true })
    //     .andWhere(
    //       new Brackets((qb) => {
    //         qb.where(':currTime >= operational_hours.open_hour', {
    //           currTime: currTime,
    //         });
    //         qb.andWhere(':currTime < operational_hours.close_hour', {
    //           currTime: currTime,
    //         });
    //         qb.andWhere('operational_hours.day_of_week = :weekOfDay', {
    //           weekOfDay: weekOfDay,
    //         });
    //       }),
    //     )
    //     .andWhere(
    //       new Brackets((qb) => {
    //         qb.where('lower(merchant_store.name) like :mname', {
    //           mname: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.phone) like :sname', {
    //           sname: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.owner_phone) like :shp', {
    //           shp: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.owner_email) like :smail', {
    //           smail: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.address) like :astrore', {
    //           astrore: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.post_code) like :pcode', {
    //           pcode: '%' + search + '%',
    //         });
    //         qb.orWhere('lower(merchant_store.guidance) like :guidance', {
    //           guidance: '%' + search + '%',
    //         });
    //         // .orWhere('merchant_store.location_longitude = :long', {
    //         //   long: search,
    //         // })
    //         // .orWhere('merchant_store.location_latitude = :lat', {
    //         //   lat: search,
    //         // })
    //       }),
    //     )
    //     .getCount()
    //     .then(async (counts) => {
    //       totalItems = counts;
    //       return await this.storeRepository
    //         .createQueryBuilder('merchant_store')
    //         .leftJoinAndSelect(
    //           'merchant_store.operational_hours',
    //           'operational_hours',
    //           'operational_hours.merchant_store_id = merchant_store.id',
    //         )
    //         .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
    //         .where('merchant_store.is_store_open = :is_open', { is_open: true })
    //         .andWhere(
    //           new Brackets((qb) => {
    //             qb.where(':currTime >= operational_hours.open_hour', {
    //               currTime: currTime,
    //             });
    //             qb.andWhere(':currTime < operational_hours.close_hour', {
    //               currTime: currTime,
    //             });
    //             qb.andWhere('operational_hours.day_of_week = :weekOfDay', {
    //               weekOfDay: weekOfDay,
    //             });
    //           }),
    //         )
    //         .andWhere(
    //           new Brackets((qb) => {
    //             qb.where('lower(merchant_store.name) like :mname', {
    //               mname: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.phone) like :sname', {
    //               sname: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.owner_phone) like :shp', {
    //               shp: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.owner_email) like :smail', {
    //               smail: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.address) like :astrore', {
    //               astrore: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.post_code) like :pcode', {
    //               pcode: '%' + search + '%',
    //             });
    //             qb.orWhere('lower(merchant_store.guidance) like :guidance', {
    //               guidance: '%' + search + '%',
    //             });
    //             // .orWhere('merchant_store.location_longitude = :long', {
    //             //   long: search,
    //             // })
    //             // .orWhere('merchant_store.location_latitude = :lat', {
    //             //   lat: search,
    //             // })
    //           }),
    //         )
    //         .orderBy('merchant_store.created_at', 'ASC')
    //         .offset((currentPage - 1) * perPage)
    //         .limit(perPage)
    //         .getMany();
    //     })
    //     .then((result) => {
    //       result.forEach((row) => {
    //         dbOutputTime(row);
    //         delete row.owner_password;
    //         row.service_addon.forEach((sao) => {
    //           delete sao.created_at;
    //           delete sao.updated_at;
    //         });
    //         row.operational_hours.forEach((oph) => {
    //           delete oph.created_at;
    //           delete oph.updated_at;
    //         });
    //       });
    //       const list_result: ListResponse = {
    //         total_item: totalItems,
    //         limit: Number(perPage),
    //         current_page: Number(currentPage),
    //         items: result,
    //       };
    //       return list_result;
    //     })
    //     .catch((err) => {
    //       const errors: RMessage = {
    //         value: '',
    //         property: '',
    //         constraint: [
    //           this.messageService.getjson({
    //             code: 'DB_ERROR',
    //             message: err.message,
    //           }),
    //         ],
    //       };
    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           errors,
    //           'Bad Request',
    //         ),
    //       );
    //     });
    // }
  }

  async updateStoreCategories(
    args: Partial<UpdateStoreCategoriesValidation>,
  ): Promise<RSuccessMessage> {
    if (args.payload.user_type == 'merchant') {
      const cekStoreId = await this.storeRepository
        .findOne({
          where: { id: args.store_id, merchant_id: args.payload.merchant_id },
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
                this.messageService.get('merchant.general.storeIdNotMatch'),
              ],
            },
            'Bad Request',
          ),
        );
      }
    }

    const stoCatExist = await this.storeRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.store_categories', 'merchant_store_categories')
      .where('s.id = :sid', { sid: args.store_id })
      .getOne()
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

    const listStoCat: StoreCategoriesDocument[] = [];
    let validStoCatId = true;
    let valueStoCatId: string;

    for (const stocatId of args.category_ids) {
      const cekStoCatId = await this.storeCategoriesRepository.findOne({
        where: { id: stocatId },
        relations: ['languages'],
      });
      if (!cekStoCatId) {
        validStoCatId = false;
        valueStoCatId = stocatId;
        break;
      }
      dbOutputTime(cekStoCatId);
      listStoCat.push(cekStoCatId);
    }
    if (!validStoCatId) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: valueStoCatId,
            property: 'category_ids',
            constraint: [this.messageService.get('merchant.general.invalidID')],
          },
          'Bad Request',
        ),
      );
    }
    stoCatExist.store_categories = listStoCat;
    return await this.storeRepository
      .save(stoCatExist)
      .then(async (updateResult) => {
        dbOutputTime(updateResult);
        delete updateResult.owner_password;
        updateResult.store_categories.forEach((sao) => {
          delete sao.created_at;
          delete sao.updated_at;
        });
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
          stoCatExist,
        );
      })
      .catch((err) => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: null,
              property: '',
              constraint: [err.message],
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
