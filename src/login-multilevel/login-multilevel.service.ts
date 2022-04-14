import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { isNotEmpty } from 'class-validator';
import { CommonService } from 'src/common/common.service';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantsService } from 'src/merchants/merchants.service';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { StoresService } from 'src/stores/stores.service';
import { ChangeLevelDto } from './validation/login_multilevel.validation';

@Injectable()
export class LoginMultilevelService {
  constructor(
    private readonly merchantUserService: MerchantUsersService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly commonService: CommonService,
    private readonly merchantService: MerchantsService,
    private readonly storeService: StoresService,
  ) {}

  async getListBrandStore(user: any): Promise<MerchantUsersDocument> {
    const existMerchantUser =
      await this.merchantUserService.getMerchantUserGroupById(user.id, user);
    if (!existMerchantUser) {
      const errors: RMessage = {
        value: user.id,
        property: 'merchant_user_id',
        constraint: [
          this.messageService.get('merchant_user.general.idNotFound'),
        ],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorized',
        ),
      );
    }
    if (!existMerchantUser.is_multilevel_login) {
      const errors: RMessage = {
        value: `${existMerchantUser.is_multilevel_login}`,
        property: 'is_multilevel_login',
        constraint: [
          this.messageService.get(
            'merchant_user.general.unauthorizedMultilevelLogin',
          ),
        ],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorized',
        ),
      );
    }

    return existMerchantUser;
  }

  async changeLevel(data: ChangeLevelDto, user: any): Promise<any> {
    const merchantUserById = await this.merchantUserService.getMerchantUserById(
      {
        id: user.id,
      },
    );

    let userGroupId = null;
    let userLevel = null;
    let groupID = '';
    let merchantID = '';
    let storeID = '';

    if (isNotEmpty(merchantUserById.group)) {
      userGroupId = merchantUserById.group.id;
      userLevel = 'group';
      groupID = merchantUserById.group.id;
    } else if (isNotEmpty(merchantUserById.merchant)) {
      userGroupId = merchantUserById.merchant.group.id;
      userLevel = 'merchant';
      merchantID = merchantUserById.merchant.id;
    } else if (isNotEmpty(merchantUserById.store)) {
      userGroupId = merchantUserById.store.merchant.group.id;
      userLevel = 'store';
      storeID = merchantUserById.store.id;
    }

    if (isNotEmpty(data.store_id)) {
      data.level = 'store';
    }
    if (isNotEmpty(data.merchant_id)) {
      data.level = 'merchant';
    }

    let merchantLevel = '';
    let phone = '';
    if (data.level == 'merchant') {
      const merchant = await this.merchantService.findMerchantById(
        data.merchant_id,
      );
      if (!merchant) {
        const errors: RMessage = {
          value: data.merchant_id,
          property: `merchant_id`,
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
          ],
        };
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            errors,
            'Unauthorized',
          ),
        );
      }
      if (merchant.group.id != userGroupId) {
        const errors: RMessage = {
          value: merchant.group.id,
          property: `merchant_id`,
          constraint: [
            this.messageService.get('merchant.general.differentGroupId'),
          ],
        };
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            errors,
            'Unauthorized',
          ),
        );
      }
      phone = merchant.phone;
      merchantLevel = 'merchant';
      merchantID = merchant.id;
    }
    if (data.level == 'store') {
      const store = await this.storeService.findStoreLevel(data.store_id);
      if (!store) {
        const errors: RMessage = {
          value: data.store_id,
          property: `store_id`,
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
          ],
        };
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            errors,
            'Unauthorized',
          ),
        );
      }
      if (store.merchant.group.id != userGroupId) {
        const errors: RMessage = {
          value: store.merchant.group_id,
          property: `store_id`,
          constraint: [
            this.messageService.get('merchant.general.differentGroupId'),
          ],
        };
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            errors,
            'Unauthorized',
          ),
        );
      }
      phone = store.phone;
      merchantLevel = 'store';
      storeID = store.id;
    }

    let role_id = null;
    if (merchantLevel == userLevel) {
      role_id = merchantUserById.role_id;
    } else {
      let code = '';
      if (merchantLevel == 'merchant') {
        code = 'brand_manager';
      } else {
        code = 'pic_store';
      }
      const urlRole = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/internal/special-roles/get-by-code/${code}`;
      try {
        const merchantRole = await this.commonService.postHttp(urlRole);
        if (merchantRole) {
          role_id = merchantRole.data.role.id;
        }
      } catch {}
    }

    const http_req: Record<string, any> = {
      phone: phone,
      id_profile: user.id,
      user_type: user.user_type,
      level: merchantLevel,
      id: user.id,
      group_id: groupID,
      merchant_id: merchantID,
      store_id: storeID,
      roles: [`${user.user_type}`],
      role_id: role_id,
    };

    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/login';
    const resp: Record<string, any> = await this.commonService.postHttp(
      url,
      http_req,
    );
    if (resp.statusCode) {
      throw resp;
    } else {
      return resp;
    }
  }

  async originalLevel(user: any): Promise<any> {
    const existMerchantUser =
      await this.merchantUserService.getMerchantUserById({
        id: user.id,
      });

    if (!existMerchantUser) {
      const errors: RMessage = {
        value: user.id,
        property: `merchant_user_id`,
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorized',
        ),
      );
    }

    let groupId = '';
    let merchantId = '';
    let storeId = '';
    let level = null;
    if (isNotEmpty(existMerchantUser.group)) {
      groupId = existMerchantUser.group.id;
      level = 'group';
    } else if (isNotEmpty(existMerchantUser.merchant)) {
      merchantId = existMerchantUser.merchant.id;
      level = 'merchant';
    } else if (isNotEmpty(existMerchantUser.store)) {
      storeId = existMerchantUser.store.id;
      level = 'store';
    }

    const http_req: Record<string, any> = {
      phone: existMerchantUser.phone,
      id_profile: user.id,
      user_type: user.user_type,
      level: level,
      id: user.id,
      group_id: groupId,
      merchant_id: merchantId,
      store_id: storeId,
      roles: [`merchant`],
      role_id: existMerchantUser.role_id,
    };

    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/login';
    const resp: Record<string, any> = await this.commonService.postHttp(
      url,
      http_req,
    );
    if (resp.statusCode) {
      throw resp;
    } else {
      return resp;
    }
  }
}
