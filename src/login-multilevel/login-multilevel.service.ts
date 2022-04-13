import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { isNotEmpty } from 'class-validator';
import { CommonService } from 'src/common/common.service';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantUsersService } from 'src/merchants/merchants_users.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { ChangeLevelDto } from './validation/login_multilevel.validation';

@Injectable()
export class LoginMultilevelService {
  constructor(
    private readonly merchantUserService: MerchantUsersService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly commonService: CommonService,
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

    let groupId = null;
    if (isNotEmpty(merchantUserById.group)) {
      groupId = merchantUserById.group.id;
    } else if (isNotEmpty(merchantUserById.merchant)) {
      groupId = merchantUserById.merchant.group.id;
    } else if (isNotEmpty(merchantUserById.store)) {
      groupId = merchantUserById.store.merchant.group.id;
    }

    let id = null;
    if (isNotEmpty(data.store_id)) {
      data.level = 'store';
      id = data.store_id;
    }
    if (isNotEmpty(data.merchant_id)) {
      data.level = 'merchant';
      id = data.merchant_id;
    }

    const existMerchantUser =
      await this.merchantUserService.getMerchantUserByLevelId(data);

    if (!existMerchantUser) {
      const errors: RMessage = {
        value: id,
        property: `${data.level}_id`,
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
    if (data.level == 'merchant') {
      if (existMerchantUser.merchant.group.id != groupId) {
        const errors: RMessage = {
          value: existMerchantUser.merchant.group.id,
          property: `${data.level}_id`,
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
    }
    if (data.level == 'store') {
      if (existMerchantUser.store.merchant.group.id != groupId) {
        const errors: RMessage = {
          value: existMerchantUser.store.merchant.group_id,
          property: `${data.level}_id`,
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
    }

    let merchantLevel = '';
    const groupID = '';
    let merchantID = '';
    let storeID = '';
    const lang = 'id';

    if (existMerchantUser.email_verified_at == null) {
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          {
            value: id,
            property: `${data.level}_id`,
            constraint: [
              this.messageService.getLang(
                `${lang}.merchant.general.unverifiedEmail`,
              ),
            ],
          },
          'Unauthorized',
        ),
      );
    }

    if (existMerchantUser.store_id != null) {
      if (existMerchantUser.store.status != 'ACTIVE') {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: existMerchantUser.store.status,
              property: 'store_status',
              constraint: [
                this.messageService.get('merchant.general.unverificatedUser'),
              ],
            },
            'Unauthorized',
          ),
        );
      }
      merchantLevel = 'store';
      storeID = existMerchantUser.store_id;
    }
    if (existMerchantUser.merchant_id != null) {
      if (
        existMerchantUser.status != 'ACTIVE' ||
        existMerchantUser.merchant.status != 'ACTIVE'
      ) {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: existMerchantUser.merchant.status,
              property: 'merchant_status',
              constraint: [
                this.messageService.get('merchant.general.unverificatedUser'),
              ],
            },
            'Unauthorized',
          ),
        );
      }
      merchantLevel = 'merchant';
      merchantID = existMerchantUser.merchant_id;
    }

    const http_req: Record<string, any> = {
      phone: existMerchantUser.phone,
      id_profile: merchantID,
      user_type: user.user_type,
      level: merchantLevel,
      id: user.id,
      group_id: groupID,
      merchant_id: merchantID,
      store_id: storeID,
      roles: [`${user.user_type}`],
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
    // const existMerchantUser =
    //   await this.merchantUserService.getMerchantUserById(user);
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

    if (existMerchantUser.email_verified_at == null) {
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          {
            value: user.id,
            property: `merchant_user_id`,
            constraint: [
              this.messageService.getLang(
                `id.merchant.general.unverifiedEmail`,
              ),
            ],
          },
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
