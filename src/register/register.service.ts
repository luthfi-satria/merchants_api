import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { GroupDocument } from 'src/database/entities/group.entity';
import { GroupsService } from 'src/groups/groups.service';
import { ResponseService } from 'src/response/response.service';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import _ from 'lodash';
import { MerchantsService } from 'src/merchants/merchants.service';
import {
  MerchantDocument,
  MerchantStatus,
} from 'src/database/entities/merchant.entity';
import { StoresService } from 'src/stores/stores.service';
import {
  enumStoreStatus,
  StoreDocument,
} from 'src/database/entities/store.entity';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { GroupUsersService } from 'src/groups/group_users.service';
import { HashService } from 'src/hash/hash.service';
import { NatsService } from 'src/nats/nats.service';
import {
  RoleService,
  SpecialRoleCodes,
} from 'src/common/services/admins/role.service';
import { GroupUser } from 'src/groups/interface/group_users.interface';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import {
  deleteCredParam,
  generateMessageRegistrationInProgress,
} from 'src/utils/general-utils';
import { CityService } from 'src/common/services/admins/city.service';
import { InjectRepository } from '@nestjs/typeorm';
import { RMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { LobDocument } from 'src/database/entities/lob.entity';
import { LobService } from 'src/lob/lob.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { StoreOperationalHoursDocument } from 'src/database/entities/store_operational_hours.entity';
import { CommonService } from 'src/common/common.service';
import { randomUUID } from 'crypto';
import { generateSmsUrlVerification } from './../utils/general-utils';
import { NotificationService } from 'src/common/notification/notification.service';

@Injectable()
export class RegistersService {
  constructor(
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    private readonly groupsService: GroupsService,
    private readonly responseService: ResponseService,
    private readonly merchantService: MerchantsService,
    private readonly storeService: StoresService,
    private readonly groupUserService: GroupUsersService,
    private readonly hashService: HashService,
    private readonly natsService: NatsService,
    private readonly roleService: RoleService,
    private readonly cityService: CityService,
    private readonly messageService: MessageService,
    private readonly lobService: LobService,
    private readonly merchantUserService: MerchantUsersService,
    private readonly commonService: CommonService,
    private readonly notificationService: NotificationService,
    private readonly connection: Connection,
  ) {}

  async createStoreOperationalHours(
    merchantStoreId: string,
    gmt_offset: number,
    queryRunner: QueryRunner,
  ) {
    try {
      const operationalHours = [];

      for (let index = 0; index < 6; index++) {
        operationalHours.push({
          merchant_store_id: merchantStoreId,
          day_of_week: index,
          gmt_offset: gmt_offset,
          is_open: false,
          shifts: [],
        });
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(StoreOperationalHoursDocument)
        .values(operationalHours)
        .execute();

      return result.raw;
    } catch (error) {
      throw error;
    }
  }

  async createUserPassword(
    groupUser: Partial<GroupUser>,
    queryRunner: QueryRunner,
  ) {
    groupUser.token_reset_password = randomUUID();

    //Cheking Env Bypass Verification
    const bypassEnv = process.env.HERMES_USER_REGISTER_BYPASS;
    const bypassUser = bypassEnv && bypassEnv == 'true' ? true : false;
    if (bypassUser) {
      groupUser.email_verified_at = new Date();
      groupUser.phone_verified_at = new Date();
    }
    // const result = await this.merchantUsersRepository.save(groupUser);
    const resultCreate = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(MerchantUsersDocument)
      .values(groupUser)
      .execute();
    const result: MerchantUsersDocument = resultCreate.raw[0];
    delete result.password;

    const token = groupUser.token_reset_password;

    const urlVerification = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${token}`;
    if (process.env.NODE_ENV == 'test') {
      result.token_reset_password = token;
      // result.url = urlVerification;
    }

    if (!bypassUser) {
      const smsMessage = await generateSmsUrlVerification(
        groupUser.name,
        urlVerification,
      );

      this.notificationService.sendSms(groupUser.phone, smsMessage);
    }
    return result;
  }

  async createMerchantUsersFromMerchant(
    args: Partial<MerchantUsersDocument>,
    queryRunner: QueryRunner,
  ): Promise<any> {
    console.log('masukcreatemerchant');
    console.log(args);
    args.token_reset_password = randomUUID();

    //Cheking Env Bypass Verification
    const bypassEnv = process.env.HERMES_USER_REGISTER_BYPASS;
    const bypassUser = bypassEnv && bypassEnv == 'true' ? true : false;
    if (bypassUser) {
      args.email_verified_at = new Date();
      args.phone_verified_at = new Date();
    }

    // const result: Record<string, any> = await this.merchantUsersRepository.save(
    //   args,
    // );
    const resultCreateMerchant = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(MerchantUsersDocument)
      .values(args)
      .execute();
    const result = resultCreateMerchant.raw[0];
    const url = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${result.token_reset_password}`;

    if (process.env.NODE_ENV == 'test') {
      result.url = url;
    }

    if (!bypassUser) {
      const smsMessage = await generateSmsUrlVerification(args.name, url);

      this.notificationService.sendSms(args.phone, smsMessage);
    }

    return result;
  }

  async registerCorporate(registerCorporateData: RegisterCorporateDto) {
    console.log(
      '===========================Start Debug registerCorporateData1=================================\n',
      new Date(Date.now()).toLocaleString(),
      '\n',
      registerCorporateData,
      '\n============================End Debug registerCorporateData1==================================',
    );
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const salt: string = await this.hashService.randomSalt();
      registerCorporateData.director_password =
        await this.hashService.hashPassword(
          registerCorporateData.director_password,
          salt,
        );

      registerCorporateData.pic_operational_password =
        await this.hashService.hashPassword(
          registerCorporateData.pic_operational_password,
          salt,
        );
      registerCorporateData.pic_finance_password =
        await this.hashService.hashPassword(
          registerCorporateData.pic_finance_password,
          salt,
        );

      const execInsertGroup = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(GroupDocument)
        .values(registerCorporateData)
        .execute();
      console.log(execInsertGroup.raw[0]);

      const resultGroup: GroupDocument = execInsertGroup.raw[0];
      console.log('resultgroup', resultGroup);
      if (registerCorporateData.status == 'ACTIVE')
        resultGroup.approved_at = new Date();
      if (registerCorporateData.status == 'REJECTED')
        resultGroup.rejected_at = new Date();

      if (!execInsertGroup) {
        throw new Error('failed insert to merchant_group');
      }

      if (resultGroup.status === 'ACTIVE') {
        this.natsService.clientEmit('merchants.group.created', resultGroup);
      }

      const specialRoles = await this.roleService.getSpecialRoleByCodes([
        SpecialRoleCodes.corporate_director,
        SpecialRoleCodes.corporate_finance,
        SpecialRoleCodes.corporate_operational,
        SpecialRoleCodes.corporate_director_finance_operational,
        SpecialRoleCodes.corporate_finance_operational,
      ]);
      console.log('masih normal');

      const array_phone = [];
      resultGroup.users = [];
      array_phone.push(registerCorporateData.director_phone);
      const create_director: Partial<GroupUser> = {
        group_id: resultGroup.id,
        name: registerCorporateData.director_name,
        phone: registerCorporateData.director_phone,
        email: registerCorporateData.director_email,
        password: registerCorporateData.director_password,
        role_id: _.find(specialRoles, {
          code: SpecialRoleCodes.corporate_director,
        }).role.id,
        status: MerchantUsersStatus.Active,
        is_multilevel_login: registerCorporateData.director_is_multilevel_login,
      };
      // role jika pic_operational & pic_finance sama dengan directur
      if (array_phone.includes(registerCorporateData.pic_operational_phone)) {
        create_director.role_id = _.find(specialRoles, {
          code: SpecialRoleCodes.corporate_director_finance_operational,
        }).role.id;
      }
      const director = await this.createUserPassword(
        create_director,
        queryRunner,
      );
      resultGroup.users.push(director);
      console.log('resultgroup_director', resultGroup);
      if (!array_phone.includes(registerCorporateData.pic_operational_phone)) {
        array_phone.push(registerCorporateData.pic_operational_phone);
        const create_pic_operational: Partial<GroupUser> = {
          group_id: resultGroup.id,
          name: registerCorporateData.pic_operational_name,
          phone: registerCorporateData.pic_operational_phone,
          email: registerCorporateData.pic_operational_email,
          password: registerCorporateData.pic_operational_password,
          nip: registerCorporateData.pic_operational_nip,
          role_id: _.find(specialRoles, {
            code: SpecialRoleCodes.corporate_operational,
          }).role.id,
          status: MerchantUsersStatus.Active,
          is_multilevel_login:
            registerCorporateData.pic_operational_is_multilevel_login,
        };
        // role jika pic_operational & pic_finance sama tetapi berbeda dengan directur
        if (
          registerCorporateData.pic_operational_phone ==
          registerCorporateData.pic_finance_phone
        ) {
          create_director.role_id = _.find(specialRoles, {
            code: SpecialRoleCodes.corporate_finance_operational,
          }).role.id;
        }
        const pic_operational = await this.createUserPassword(
          create_pic_operational,
          queryRunner,
        );
        resultGroup.users.push(pic_operational);
      }
      if (!array_phone.includes(registerCorporateData.pic_finance_phone)) {
        array_phone.push(registerCorporateData.pic_finance_phone);
        const create_pic_finance: Partial<GroupUser> = {
          group_id: resultGroup.id,
          name: registerCorporateData.pic_finance_name,
          phone: registerCorporateData.pic_finance_phone,
          email: registerCorporateData.pic_finance_email,
          password: registerCorporateData.pic_finance_password,
          nip: registerCorporateData.pic_finance_nip,
          role_id: _.find(specialRoles, {
            code: SpecialRoleCodes.corporate_finance,
          }).role.id,
          status: MerchantUsersStatus.Active,
          is_multilevel_login:
            registerCorporateData.pic_finance_is_multilevel_login,
        };
        const pic_finance = await this.createUserPassword(
          create_pic_finance,
          queryRunner,
        );
        resultGroup.users.push(pic_finance);
      }
      deleteCredParam(resultGroup);
      console.log('masihnormal2');

      await this.groupsService.manipulateGroupUrl(resultGroup);

      const resultCreateGroup: Record<string, any> = { ...resultGroup };
      for (let i = 0; i < resultGroup.users.length; i++) {
        const url = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${resultGroup.users[i].token_reset_password}`;
        resultCreateGroup.users[i].url_reset_password = url;
      }
      console.log(resultGroup);
      // create brand or merchant process
      const status: MerchantStatus =
        MerchantStatus.Waiting_for_corporate_approval;
      const createMerchantData = {
        group_id: resultGroup.id,
        type: registerCorporateData.type,
        name: registerCorporateData.name,
        phone: registerCorporateData.phone,
        logo: registerCorporateData.logo,
        profile_store_photo: registerCorporateData.profile_store_photo,
        address: registerCorporateData.address,
        lob_id: registerCorporateData.lob_id,
        pb1: registerCorporateData.pb1,
        pb1_tariff: registerCorporateData.pb1_tariff,
        npwp_no: registerCorporateData.brand_npwp_no,
        npwp_name: registerCorporateData.brand_npwp_name,
        npwp_file: registerCorporateData.brand_npwp_file,
        is_pos_checkin_enabled: registerCorporateData.is_pos_checkin_enabled,
        is_pos_endofday_enabled: registerCorporateData.is_pos_endofday_enabled,
        is_pos_printer_enabled: registerCorporateData.is_pos_printer_enabled,
        is_manual_refund_enabled:
          registerCorporateData.is_manual_refund_enabled,
        is_pos_rounded_payment: registerCorporateData.is_pos_rounded_payment,
        pic_name: registerCorporateData.pic_name,
        pic_nip: registerCorporateData.pic_nip,
        pic_phone: registerCorporateData.pic_phone,
        pic_email: registerCorporateData.pic_email,
        pic_password: registerCorporateData.pic_password,
        pic_is_multilevel_login: registerCorporateData.pic_is_multilevel_login,
        pic_is_director: registerCorporateData.pic_is_director,
        status: status,
      };

      console.log('cratemerchantData', createMerchantData);

      const pic_is_director =
        createMerchantData.pic_is_director == 'true' ? true : false;
      const pic_is_multilevel_login =
        createMerchantData.pic_is_multilevel_login == 'true' ? true : false;
      await this.merchantService.validateMerchantUniqueName(
        createMerchantData.name,
      );
      await this.merchantService.validateMerchantUniquePhone(
        createMerchantData.phone,
      );
      const cekphone: MerchantDocument = await this.merchantRepository.findOne({
        where: { pic_phone: createMerchantData.pic_phone },
      });
      console.log('masihnormal3');
      if (cekphone && !pic_is_director) {
        const errors: RMessage = {
          value: createMerchantData.pic_phone,
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

      console.log('masihnormal4');

      const cekemail: MerchantDocument = await this.merchantRepository.findOne({
        where: { pic_email: createMerchantData.pic_email },
      });
      if (cekemail) {
        const errors: RMessage = {
          value: createMerchantData.pic_email,
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
      console.log('masihnormal5');
      console.log(createMerchantData);
      // const cekgroup = await this.groupsService.findGroupById(
      //   createMerchantData.group_id,
      // );
      // console.log('cekgroup', cekgroup)
      // if (!cekgroup) {
      //   console.log('error');
      //   console.log(createMerchantData.group_id);
      //   const errors: RMessage = {
      //     value: createMerchantData.group_id,
      //     property: 'group_id',
      //     constraint: [
      //       this.messageService.get('merchant.createmerchant.groupid_notfound'),
      //     ],
      //   };
      //   throw new BadRequestException(
      //     this.responseService.error(
      //       HttpStatus.BAD_REQUEST,
      //       errors,
      //       'Bad Request',
      //     ),
      //   );
      // }

      console.log('masihnormal6');

      const ceklob: LobDocument = await this.lobService.findLobById(
        createMerchantData.lob_id,
      );
      console.log('masihnormal4');
      if (!ceklob) {
        console.log('ceklob');
        const errors: RMessage = {
          value: createMerchantData.lob_id,
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
          createMerchantData.pic_email,
          createMerchantData.pic_phone,
          '',
        );

      const salt2: string = await this.hashService.randomSalt();
      createMerchantData.pic_password = await this.hashService.hashPassword(
        createMerchantData.pic_password,
        salt2,
      );
      const pb1 = createMerchantData.pb1 == 'true' ? true : false;
      const merchantDTO: Partial<MerchantDocument> = {
        group_id: createMerchantData.group_id,
        type: createMerchantData.type,
        name: createMerchantData.name,
        phone: createMerchantData.phone,
        profile_store_photo: createMerchantData.profile_store_photo,
        address: createMerchantData.address,
        lob_id: createMerchantData.lob_id,
        pb1: pb1,
        pic_name: createMerchantData.pic_name,
        pic_phone: createMerchantData.pic_phone,
        pic_email: createMerchantData.pic_email,
        pic_password: createMerchantData.pic_password,
        status: createMerchantData.status,
        pic_is_multilevel_login: pic_is_multilevel_login,
        npwp_no: createMerchantData.npwp_no,
        npwp_name: createMerchantData.npwp_name,
        npwp_file: createMerchantData.npwp_file,
      };

      merchantDTO.logo = createMerchantData.logo ? createMerchantData.logo : '';
      merchantDTO.pic_nip = createMerchantData.pic_nip
        ? createMerchantData.pic_nip
        : '';
      if (pb1) {
        merchantDTO.pb1_tariff = Number(createMerchantData.pb1_tariff);
        merchantDTO.npwp_no = createMerchantData.npwp_no;
        merchantDTO.npwp_name = createMerchantData.npwp_name;
        merchantDTO.npwp_file = createMerchantData.npwp_file;
      }
      if (merchantDTO.status == 'ACTIVE') merchantDTO.approved_at = new Date();
      if (merchantDTO.status == 'REJECTED')
        merchantDTO.rejected_at = new Date();

      console.log('merchantdro', merchantDTO);

      const execInsertMerchant = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(MerchantDocument)
        .values(merchantDTO)
        .execute();

      const resultInsertMerchant: MerchantDocument = execInsertMerchant.raw[0];
      this.merchantService.publishNatsCreateMerchant(
        Object.assign(new MerchantDocument(), resultInsertMerchant),
      );

      if (!execInsertMerchant) {
        throw new Error('failed insert to merchant_group');
      }

      const specialRoles2 = await this.roleService.getSpecialRoleByCode(
        SpecialRoleCodes.brand_manager,
      );
      const createMerchantUser: Partial<MerchantUsersDocument> = {
        merchant_id: resultInsertMerchant.id,
        name: merchantDTO.pic_name,
        phone: merchantDTO.pic_phone,
        email: merchantDTO.pic_email,
        password: merchantDTO.pic_password,
        nip: merchantDTO.pic_nip,
        role_id: specialRoles2.role_id,
      };
      console.log('createmerchuser', createMerchantUser);

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
        const result = await this.createMerchantUsersFromMerchant(
          createMerchantUser,
          queryRunner,
        );
        deleteCredParam(result);
        resultInsertMerchant.user = result;
        deleteCredParam(resultInsertMerchant);
      }

      const pclogdata = {
        id: resultInsertMerchant.id,
      };
      const createCatalog = await this.merchantService.createCatalogs(
        pclogdata,
      );
      console.log(createCatalog);

      await this.merchantService.manipulateMerchantUrl(resultInsertMerchant);
      if (resultInsertMerchant.group)
        await this.groupsService.manipulateGroupUrl(resultInsertMerchant.group);

      // create store process
      await this.storeService.validateStoreUniqueName(
        registerCorporateData.name,
      );
      const store_document: Partial<StoreDocument> = {};
      Object.assign(store_document, registerCorporateData);
      store_document.photo = createMerchantData.profile_store_photo;

      console.log(
        '===========================Start Debug registerCorporateData2=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        registerCorporateData,
        '\n============================End Debug registerCorporateData2==================================',
      );

      store_document.city = await this.cityService.getCity(
        registerCorporateData.city_id,
      );
      console.log('normal77');

      // const merchant: MerchantDocument =
      //   await this.merchantService.findMerchantById(createMerchantUser.id);
      // if (!merchant) {
      //   console.log(createMerchantUser.id);
      //   const errors: RMessage = {
      //     value: createMerchantUser.id,
      //     property: 'merchant_id',
      //     constraint: [
      //       this.messageService.get('merchant.createstore.merchantid_notfound'),
      //     ],
      //   };
      //   throw new BadRequestException(
      //     this.responseService.error(
      //       HttpStatus.BAD_REQUEST,
      //       errors,
      //       'Bad Request',
      //     ),
      //   );
      // }

      // console.log('normal88W');

      let flagCreatePricingTemplate = false;
      const countStore = await this.storeRepository.count({
        where: { merchant_id: createMerchantUser.merchant_id },
      });
      if (countStore == 0) {
        flagCreatePricingTemplate = true;
        store_document.platform = true;
      }

      store_document.location_latitude =
        registerCorporateData.location_latitude;
      store_document.location_longitude =
        registerCorporateData.location_longitude;
      store_document.merchant_id = createMerchantUser.merchant_id;
      store_document.store_categories =
        await this.storeService.getCategoriesByIds(
          registerCorporateData.category_ids,
        );
      console.log(registerCorporateData.category_ids);
      store_document.service_addons = await this.storeService.getAddonssBtIds(
        registerCorporateData.service_addons,
      );
      console.log(registerCorporateData.service_addons);
      if (createMerchantUser.status == 'WAITING_FOR_APPROVAL') {
        store_document.status = enumStoreStatus.waiting_for_brand_approval;
      }
      if (store_document.status == 'ACTIVE')
        store_document.approved_at = new Date();
      if (store_document.status == 'REJECTED')
        store_document.rejected_at = new Date();

      store_document.auto_accept_order =
        registerCorporateData.auto_accept_order == 'true' ? true : false;
      console.log('store_doc', store_document);

      console.log(
        '===========================Start Debug registerCorporateData3=================================\n',
        new Date(Date.now()).toLocaleString(),
        '\n',
        registerCorporateData,
        '\n============================End Debug registerCorporateData3==================================',
      );

      const execInsertStore = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(StoreDocument)
        .values(store_document)
        .execute();

      const resultInsertStore: StoreDocument = execInsertStore.raw[0];
      this.storeService.publishNatsCreateStore(resultInsertStore);

      // create operational hours
      const operational_hours = await this.createStoreOperationalHours(
        resultInsertStore.id,
        resultInsertStore.gmt_offset,
        queryRunner,
      );

      if (flagCreatePricingTemplate) {
        const url = `${process.env.BASEURL_CATALOGS_SERVICE}/api/v1/internal/catalogs/populate/pricing-template`;
        const requestData = {
          merchant_id: createMerchantUser.merchant_id,
          store_id: createMerchantUser.id,
        };

        await this.commonService.postHttp(url, requestData);
      }

      Object.assign(resultInsertStore, { operational_hours });

      // await this.storeService.validateStoreUniqueName(createMerchantData.name);
      // const store_document: Partial<StoreDocument> = {};
      // Object.assign(store_document, createMerchantData);

      // store_document.city = await this.cityService.getCity

      // const createMerchant =
      //   await this.merchantService.createMerchantMerchantProfile(
      //     createMerchantData,
      //     null,
      //   );
      // console.log('createMerchant', createMerchant);
      // const merchant_id: string = createMerchant.data.id;

      // const createStoreDto = {
      //   id: null,
      //   merchant_id: merchant_id,
      //   name: registerCorporateData.name,
      //   phone: registerCorporateData.pic_phone,
      //   email: registerCorporateData.pic_email,
      //   city_id: registerCorporateData.city_id,
      //   address: registerCorporateData.address,
      //   gmt_offset: registerCorporateData.gmt_offset,
      //   photo: registerCorporateData.profile_store_photo,
      //   banner: 'https://dummyimage.com/600x400/968a96/ffffff&text=Photo+Image',
      //   category_ids: registerCorporateData.category_ids,
      //   delivery_type: registerCorporateData.delivery_type,
      //   service_addons: registerCorporateData.service_addons,
      //   bank_id: registerCorporateData.bank_id,
      //   bank_account_no: registerCorporateData.bank_account_no,
      //   bank_account_name: registerCorporateData.bank_account_name,
      //   status: enumStoreStatus.waiting_for_approval,
      //   auto_accept_order: registerCorporateData.auto_accept_order,
      // };

      // const createStore = await this.storeService.createMerchantStoreProfile(
      //   createStoreDto,
      //   null,
      // );

      await queryRunner.commitTransaction();

      this.notificationService.sendEmail(
        registerCorporateData.director_email,
        'Registrasi sedang dalam verifikasi',
        '',
        generateMessageRegistrationInProgress(),
      );

      return {
        group: resultGroup,
        merchant: resultInsertMerchant,
        store: resultInsertStore,
      };
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
