import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupDocument, GroupStatus } from 'src/database/entities/group.entity';
import {
  MerchantUsersDocument,
  MerchantUsersStatus,
} from 'src/database/entities/merchant_users.entity';
import { GroupsService } from 'src/groups/groups.service';
import { GroupUsersService } from 'src/groups/group_users.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import { HashService } from 'src/hash/hash.service';
import { CreateGroupDTO } from 'src/groups/validation/create_groups.dto';
import { NatsService } from 'src/nats/nats.service';
import {
  RoleService,
  SpecialRoleCodes,
} from 'src/common/services/admins/role.service';
import { GroupUser } from 'src/groups/interface/group_users.interface';
import _ from 'lodash';
import { deleteCredParam } from 'src/utils/general-utils';
import { MerchantsService } from 'src/merchants/merchants.service';
import {
  MerchantDocument,
  MerchantStatus,
  MerchantType,
} from 'src/database/entities/merchant.entity';
import { RMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { CreateMerchantDTO } from 'src/merchants/validation/create_merchant.dto';
import { StoresService } from 'src/stores/stores.service';
import { CreateMerchantStoreValidation } from 'src/stores/validation/create-merchant-stores.validation';
import { enumStoreStatus } from 'src/database/entities/store.entity';

@Injectable()
export class RegistersService {
  constructor(
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    private readonly groupsService: GroupsService,
    private readonly groupUserService: GroupUsersService,
    private readonly hashService: HashService,
    private readonly natsService: NatsService,
    private readonly roleService: RoleService,
    private readonly responseService: ResponseService,
    private readonly merchantService: MerchantsService,
    private readonly messageService: MessageService,
    private readonly storeService: StoresService,
  ) {}

  async registerCorporate(registerCorporateData: RegisterCorporateDto) {
    try {
      const createGroup: GroupDocument =
        await this.groupsService.createMerchantGroupProfile(
          registerCorporateData,
        );
      await this.groupsService.manipulateGroupUrl(createGroup);

      const resultCreateGroup: Record<string, any> = { ...createGroup };
      for (let i = 0; i < createGroup.users.length; i++) {
        const url = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${createGroup.users[i].token_reset_password}`;
        resultCreateGroup.users[i].url_reset_password = url;
      }
      console.log(resultCreateGroup);

      // create brand or merchant
      const status: MerchantStatus = MerchantStatus.Waiting_for_approval;
      const createMerchantData: CreateMerchantDTO = {
        id: null,
        group_id: createGroup.id,
        type: registerCorporateData.type,
        name: registerCorporateData.name,
        phone: registerCorporateData.phone,
        logo: registerCorporateData.logo,
        profile_store_photo: registerCorporateData.profile_store_photo,
        address: registerCorporateData.address,
        lob_id: registerCorporateData.lob_id,
        pb1: registerCorporateData.pb1,
        pb1_tariff: registerCorporateData.pb1_tariff,
        npwp_no: registerCorporateData.npwp_no,
        npwp_name: registerCorporateData.npwp_name,
        npwp_file: registerCorporateData.npwp_file,
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

      const createMerchant =
        await this.merchantService.createMerchantMerchantProfile(
          createMerchantData,
          null,
        );
      console.log('createMerchant', createMerchant);
      const merchant_id: string = createMerchant.data.id;

      const createStoreDto: CreateMerchantStoreValidation = {
        id: null,
        merchant_id: merchant_id,
        name: registerCorporateData.name,
        phone: registerCorporateData.pic_phone,
        email: registerCorporateData.pic_email,
        city_id: registerCorporateData.city_id,
        address: registerCorporateData.address,
        gmt_offset: registerCorporateData.gmt_offset,
        photo: registerCorporateData.profile_store_photo,
        banner: null,
        category_ids: registerCorporateData.category_ids,
        delivery_type: registerCorporateData.delivery_type,
        service_addons: registerCorporateData.service_addons,
        bank_id: registerCorporateData.bank_id,
        bank_account_no: registerCorporateData.bank_account_no,
        bank_account_name: registerCorporateData.bank_account_name,
        status: enumStoreStatus.waiting_for_approval,
        auto_accept_order: registerCorporateData.auto_accept_order,
      };

      const createStore = await this.storeService.createMerchantStoreProfile(
        createStoreDto,
        null,
      );

      return {
        group: createGroup,
        merchant: createMerchant,
        store: createStore,
      };
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
}
