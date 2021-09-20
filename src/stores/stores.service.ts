import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { AddonsService } from 'src/addons/addons.service';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MessageService } from 'src/message/message.service';
import {
  ListResponse,
  RMessage,
  RSuccessMessage,
} from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime, deleteCredParam } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { StoreOperationalService } from './stores-operational.service';
import { UpdateStoreCategoriesValidation } from './validation/update-store-categories.validation';
import { StoreCategoriesDocument } from 'src/database/entities/store-categories.entity';
import { CreateMerchantStoreValidation } from './validation/create-merchant-stores.validation';
import { UpdateMerchantStoreValidation } from './validation/update-merchant-stores.validation';
import { CityService } from 'src/common/services/admins/city.service';
import { ListStoreDTO } from './validation/list-store.validation';

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
    // private readonly connection: Connection,
    private readonly cityService: CityService,
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
      relations: ['operational_hours', 'service_addons'],
    });
  }

  async getCategoriesByIds(ids: string[]): Promise<StoreCategoriesDocument[]> {
    const categories: StoreCategoriesDocument[] = [];
    for (const category_id of ids) {
      const category = await this.storeCategoriesRepository.findOne(
        category_id,
      );
      if (!category) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: category_id,
              property: 'category_ids',
              constraint: [
                this.messageService.get(
                  'merchant.createstore.store_category_not_found',
                ),
              ],
            },
            'Bad Request',
          ),
        );
      }
      dbOutputTime(category);
      categories.push(category);
    }
    return categories;
  }

  async getAddonssBtIds(ids: string[]): Promise<AddonDocument[]> {
    const addons: AddonDocument[] = [];
    for (const addon_id of ids) {
      const addon = await this.addonService.findAddonById(addon_id);
      if (!addon) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: addon_id,
              property: 'service_addon',
              constraint: [
                this.messageService.get('merchant.createstore.addonid_unreg'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      dbOutputTime(addon);
      addons.push(addon);
    }
    return addons;
  }

  async createMerchantStoreProfile(
    create_merchant_store_validation: CreateMerchantStoreValidation,
  ): Promise<StoreDocument> {
    const store_document: Partial<StoreDocument> = {};
    Object.assign(store_document, create_merchant_store_validation);

    store_document.city = await this.cityService.getCity(
      create_merchant_store_validation.city_id,
    );
    const merchant: MerchantDocument =
      await this.merchantService.findMerchantById(
        create_merchant_store_validation.merchant_id,
      );
    if (!merchant) {
      const errors: RMessage = {
        value: create_merchant_store_validation.merchant_id,
        property: 'merchant_id',
        constraint: [
          this.messageService.get('merchant.createstore.merchantid_notfound'),
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
    if (merchant.status != 'ACTIVE') {
      const errors: RMessage = {
        value: create_merchant_store_validation.merchant_id,
        property: 'merchant_id',
        constraint: [
          this.messageService.get('merchant.createstore.merchantid_notactive'),
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

    store_document.store_categories = await this.getCategoriesByIds(
      create_merchant_store_validation.category_ids,
    );
    store_document.service_addons = await this.getAddonssBtIds(
      create_merchant_store_validation.service_addons,
    );
    const create_store = await this.storeRepository.save(store_document);

    const operational_hours = await this.storeOperationalService
      .createStoreOperationalHours(create_store.id, create_store.gmt_offset)
      .catch((e) => {
        throw e;
      });

    return Object.assign(create_store, { operational_hours });
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
    update_merchant_store_validation: UpdateMerchantStoreValidation,
  ): Promise<StoreDocument> {
    const store_document: StoreDocument = await this.storeRepository.findOne(
      update_merchant_store_validation.id,
      {
        relations: ['service_addons', 'operational_hours'],
      },
    );
    if (!store_document) {
      const errors: RMessage = {
        value: update_merchant_store_validation.id,
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
    Object.assign(store_document, update_merchant_store_validation);

    if (update_merchant_store_validation.city_id) {
      update_merchant_store_validation.city = await this.cityService.getCity(
        update_merchant_store_validation.city_id,
      );
    }

    if (update_merchant_store_validation.category_ids) {
      store_document.store_categories = await this.getCategoriesByIds(
        update_merchant_store_validation.category_ids,
      );
    }
    if (update_merchant_store_validation.service_addons) {
      store_document.service_addons = await this.getAddonssBtIds(
        update_merchant_store_validation.service_addons,
      );
    }

    if (update_merchant_store_validation.merchant_id) {
      const cekmerchant: MerchantDocument =
        await this.merchantService.findMerchantById(
          update_merchant_store_validation.merchant_id,
        );
      if (!cekmerchant) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: update_merchant_store_validation.merchant_id,
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
          value: update_merchant_store_validation.merchant_id,
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
      // store_exist.merchant_id = data.merchant_id;
    }
    return this.storeRepository.save(store_document);
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
    data: ListStoreDTO,
    user: Record<string, string>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = Number(data.limit) || 10;
    // let totalItems: number;

    const store = this.storeRepository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.service_addons', 'merchant_addons')
      .leftJoinAndSelect('ms.merchant', 'merchant')
      .leftJoinAndSelect('merchant.group', 'group');
    if (search) {
      store.andWhere(
        new Brackets((qb) => {
          qb.where('ms.name ilike :mname', {
            mname: '%' + search + '%',
          });
          qb.orWhere('ms.phone ilike :sname', {
            sname: '%' + search + '%',
          });
          qb.orWhere('ms.owner_phone ilike :shp', {
            shp: '%' + search + '%',
          });
          qb.orWhere('ms.owner_email ilike :smail', {
            smail: '%' + search + '%',
          });
          qb.orWhere('ms.address ilike :astrore', {
            astrore: '%' + search + '%',
          });
          qb.orWhere('ms.post_code ilike :pcode', {
            pcode: '%' + search + '%',
          });
          qb.orWhere('ms.guidance ilike :guidance', {
            guidance: '%' + search + '%',
          });
        }),
      );
    }

    if (data.group_category) {
      store.andWhere('group.category = :gcat', {
        gcat: data.group_category,
      });
    }

    if (data.status) {
      store.andWhere('group.status = :gstat', {
        gstat: data.status,
      });
    }

    if (
      (user.user_type == 'admin' || user.level == 'group') &&
      data.merchant_id
    ) {
      store.andWhere('merchant.id = :mid', {
        mid: data.merchant_id,
      });
    }

    if (user.level == 'store') {
      store.andWhere('ms.id = :mid', {
        mid: user.store_id,
      });
    } else if (user.level == 'merchant') {
      store.andWhere('merchant.id = :mid', {
        mid: user.merchant_id,
      });
    } else if (user.level == 'group') {
      store.andWhere('group.id = :group_id', {
        group_id: user.group_id,
      });
    }

    store
      .orderBy('ms.created_at', 'ASC')
      .offset((Number(currentPage) - 1) * perPage)
      .limit(perPage);

    try {
      const totalItems = await store.getCount();
      const list = await store.getMany();
      list.map(async (element) => {
        deleteCredParam(element);
        deleteCredParam(element.merchant);
        const row = deleteCredParam((await element.merchant).group);
        if (row.service_addon) {
          row.service_addon.forEach((sao: any) => {
            deleteCredParam(sao);
          });
        }
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
        // delete updateResult.owner_password;
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
