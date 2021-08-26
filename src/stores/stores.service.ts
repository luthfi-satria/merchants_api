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
import { StoreDocument } from 'src/database/entities/store.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MessageService } from 'src/message/message.service';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { dbOutputTime } from 'src/utils/general-utils';
import { Brackets, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { StoreOperationalService } from './stores-operational.service';
import { DateTimeUtils } from 'src/utils/date-time-utils';

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
      .delete(delete_merchant)
      .then(() => {
        return this.merchantUsersRepository.delete({ store_id: data });
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

    // evaluate store operational hour
    const currTime = DateTimeUtils.DateTimeToWIB(new Date());
    const weekOfDay = DateTimeUtils.getDayOfWeekInWIB();

<<<<<<< HEAD
    const store = this.storeRepository
      .createQueryBuilder('merchant_store')
      .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
      .leftJoinAndSelect(
        'merchant_store.operational_hours',
        'operational_hours',
        'operational_hours.merchant_store_id = merchant_store.id',
      )
      .where('merchant_store.is_store_open = :is_open', { is_open: true })
      .andWhere(
        new Brackets((qb) => {
          qb.where(':currTime >= operational_hours.open_hour', {
            currTime: currTime,
          });
          qb.andWhere(':currTime < operational_hours.close_hour', {
            currTime: currTime,
=======
    if (merchant.user_type == 'merchant') {
      return await this.storeRepository
        .createQueryBuilder('merchant_store')
        .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
        .where('merchant_store.is_store_open = :is_open', { is_open: true })
        .andWhere(
          new Brackets((qb) => {
            qb.where('operational_hours.day_of_week = :weekOfDay', {
              weekOfDay: weekOfDay,
            });
            qb.andWhere(
              new Brackets((qb) => {
                qb.where('operational_hours.is_open_24h = :is_open_24h', {
                  is_open_24h: true,
                }).orWhere(
                  new Brackets((qb) => {
                    qb.where(':currTime >= operational_hours.open_hour', {
                      currTime: currTime,
                    });
                    qb.andWhere(':currTime < operational_hours.close_hour', {
                      currTime: currTime,
                    });
                  }),
                );
              }),
            );
          }),
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where('(lower(merchant_store.name) like :mname', {
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
            // .orWhere('merchant_store.location_longitude = :long', {
            //   long: search,
            // })
            // .orWhere('merchant_store.location_latitude = :lat)', {
            //   lat: search,
            // })
          }),
        )
        .andWhere('merchant_store.merchant_id = :mid', { mid: merchant.id })
        .getCount()
        .then(async (counts) => {
          totalItems = counts;
          return await this.storeRepository
            .createQueryBuilder('merchant_store')
            .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
            .leftJoinAndSelect(
              'merchant_store.operational_hours',
              'operational_hours',
              'operational_hours.merchant_store_id = merchant_store.id',
            )
            .where('merchant_store.is_store_open = :is_open', { is_open: true })
            .andWhere(
              new Brackets((qb) => {
                qb.where('operational_hours.day_of_week = :weekOfDay', {
                  weekOfDay: weekOfDay,
                });
                qb.andWhere(
                  new Brackets((qb) => {
                    qb.where('operational_hours.is_open_24h = :is_open_24h', {
                      is_open_24h: true,
                    }).orWhere(
                      new Brackets((qb) => {
                        qb.where(':currTime >= operational_hours.open_hour', {
                          currTime: currTime,
                        });
                        qb.andWhere(
                          ':currTime < operational_hours.close_hour',
                          {
                            currTime: currTime,
                          },
                        );
                      }),
                    );
                  }),
                );
              }),
            )
            .andWhere(
              new Brackets((qb) => {
                qb.where('(lower(merchant_store.name) like :mname', {
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
                // .orWhere('merchant_store.location_longitude = :long', {
                //   long: search,
                // })
                // .orWhere('merchant_store.location_latitude = :lat)', {
                //   lat: search,
                // })
              }),
            )
            .andWhere('merchant_store.merchant_id = :mid', { mid: merchant.id })
            .orderBy('merchant_store.created_at', 'DESC')
            .offset((currentPage - 1) * perPage)
            .limit(perPage)
            .getMany();
        })
        .then((result) => {
          result.forEach((row) => {
            dbOutputTime(row);
            delete row.owner_password;
            row.service_addon.forEach((sao) => {
              delete sao.created_at;
              delete sao.updated_at;
            });
          });
          const list_result: ListResponse = {
            total_item: totalItems,
            limit: Number(perPage),
            current_page: Number(currentPage),
            items: result,
          };
          return list_result;
        })
        .catch((err) => {
          const errors: RMessage = {
            value: '',
            property: '',
            constraint: [
              this.messageService.getjson({
                code: 'DB_ERROR',
                message: err.message,
              }),
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
    } else {
      return await this.storeRepository
        .createQueryBuilder('merchant_store')
        .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
        .leftJoinAndSelect(
          'merchant_store.operational_hours',
          'operational_hours',
          'operational_hours.merchant_store_id = merchant_store.id',
        )
        .where('merchant_store.is_store_open = :is_open', { is_open: true })
        .andWhere(
          new Brackets((qb) => {
            qb.where('operational_hours.day_of_week = :weekOfDay', {
              weekOfDay: weekOfDay,
            });
            qb.andWhere(
              new Brackets((qb) => {
                qb.where('operational_hours.is_open_24h = :is_open_24h', {
                  is_open_24h: true,
                }).orWhere(
                  new Brackets((qb) => {
                    qb.where(':currTime >= operational_hours.open_hour', {
                      currTime: currTime,
                    });
                    qb.andWhere(':currTime < operational_hours.close_hour', {
                      currTime: currTime,
                    });
                  }),
                );
              }),
            );
          }),
        )
        .andWhere(
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
            // .orWhere('merchant_store.location_longitude = :long', {
            //   long: search,
            // })
            // .orWhere('merchant_store.location_latitude = :lat', {
            //   lat: search,
            // })
          }),
        )
        .getCount()
        .then(async (counts) => {
          totalItems = counts;
          return await this.storeRepository
            .createQueryBuilder('merchant_store')
            .leftJoinAndSelect(
              'merchant_store.operational_hours',
              'operational_hours',
              'operational_hours.merchant_store_id = merchant_store.id',
            )
            .leftJoinAndSelect('merchant_store.service_addon', 'merchant_addon')
            .where('merchant_store.is_store_open = :is_open', { is_open: true })
            .andWhere(
              new Brackets((qb) => {
                qb.where('operational_hours.day_of_week = :weekOfDay', {
                  weekOfDay: weekOfDay,
                });
                qb.andWhere(
                  new Brackets((qb) => {
                    qb.where('operational_hours.is_open_24h = :is_open_24h', {
                      is_open_24h: true,
                    }).orWhere(
                      new Brackets((qb) => {
                        qb.where(':currTime >= operational_hours.open_hour', {
                          currTime: currTime,
                        });
                        qb.andWhere(
                          ':currTime < operational_hours.close_hour',
                          { currTime: currTime },
                        );
                      }),
                    );
                  }),
                );
              }),
            )
            .andWhere(
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
                // .orWhere('merchant_store.location_longitude = :long', {
                //   long: search,
                // })
                // .orWhere('merchant_store.location_latitude = :lat', {
                //   lat: search,
                // })
              }),
            )
            .orderBy('merchant_store.created_at', 'ASC')
            .offset((currentPage - 1) * perPage)
            .limit(perPage)
            .getMany();
        })
        .then((result) => {
          result.forEach((row) => {
            dbOutputTime(row);
            delete row.owner_password;
            row.service_addon.forEach((sao) => {
              delete sao.created_at;
              delete sao.updated_at;
            });
            row.operational_hours.forEach((oph) => {
              delete oph.created_at;
              delete oph.updated_at;
            });
>>>>>>> a0e827bf43e3c7494da33e195965a3c20be4ae39
          });
          qb.andWhere('operational_hours.day_of_week = :weekOfDay', {
            weekOfDay: weekOfDay,
          });
        }),
      );
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
    try {
      const totalItems = await store.getCount();
      const list = await store
        .orderBy('merchant_store.created_at', 'ASC')
        .offset((currentPage - 1) * perPage)
        .limit(perPage)
        .getMany();
      list.map((element) => {
        const row = dbOutputTime(element);
        delete row.owner_password;
        row.service_addon.forEach((sao) => {
          delete sao.created_at;
          delete sao.updated_at;
        });
        row.operational_hours.forEach((oph) => {
          delete oph.created_at;
          delete oph.updated_at;
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
