import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { HashService } from 'src/hash/hash.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Hash } from 'src/hash/hash.decorator';
import { LoginEmailValidation } from './validation/login.email.validation';
import { OtpEmailValidateValidation } from './validation/otp.email-validate.validation';
import { CommonService } from 'src/common/common.service';
import { LoginPhoneValidation } from './validation/login.phone.validation';
import { UbahPasswordValidation } from './validation/ubah-password.validation';
import {
  deleteCredParam,
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { UpdateProfileValidation } from './validation/update-profile.validation';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { StoreDocument } from 'src/database/entities/store.entity';
import { GroupDocument } from 'src/database/entities/group.entity';

const defaultHeadersReq: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(GroupDocument)
    private readonly groupRepository: Repository<GroupDocument>,

    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    private readonly commonService: CommonService,
  ) {}

  async postHttp(
    url: string,
    body: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.post(url, body, { headers: headers }).pipe(
      map((response: any) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }

  async loginEmailOtpValidationProcess(
    data: OtpEmailValidateValidation,
  ): Promise<Observable<Promise<any>>> {
    const existMerchantUser = await this.merchantUsersRepository
      .findOne({ where: { email: data.email } })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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

    if (!existMerchantUser) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [
          this.messageService.get('merchant.login.unregistered_email'),
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
    let merchantLevel = '';
    let groupID = '';
    let merchantID = '';
    let storeID = '';
    const id = existMerchantUser.id;

    if (existMerchantUser.store_id != null) {
      merchantLevel = 'store';
      storeID = existMerchantUser.store_id;
    }
    if (existMerchantUser.merchant_id != null) {
      merchantLevel = 'merchant';
      merchantID = existMerchantUser.merchant_id;
    }
    if (existMerchantUser.group_id != null) {
      merchantLevel = 'group';
      groupID = existMerchantUser.group_id;
    }

    const http_req: Record<string, any> = {
      email: data.email,
      id_profile: merchantID,
      user_type: 'merchant',
      level: merchantLevel,
      id: id,
      group_id: groupID,
      merchant_id: merchantID,
      store_id: storeID,
      roles: ['merchant'],
      otp_code: data.otp_code,
    };
    const url: string =
      process.env.BASEURL_AUTH_SERVICE +
      '/api/v1/auth/otp-login-email-validation';
    return (await this.postHttp(url, http_req, defaultHeadersReq)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;
        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        delete response.data.payload;
        return this.responseService.success(
          true,
          this.messageService.get('merchant.login.success'),
          response.data,
        );
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  async loginEmailProcess(
    request: LoginEmailValidation,
  ): Promise<Observable<Promise<any>>> {
    // let existMerchantUser: MerchantUsersDocument;
    const existMerchantUser = await this.merchantUsersRepository
      .findOne({ where: { email: request.email } })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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

    if (!existMerchantUser) {
      const errors: RMessage = {
        value: request.email,
        property: 'email',
        constraint: [
          this.messageService.get('merchant.login.unregistered_email'),
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

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-login-email';
    return (await this.postHttp(url, request, defaultHeadersReq)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;
        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  async loginPhoneOtpValidationProcess(
    data: Record<string, any>,
  ): Promise<Observable<Promise<any>>> {
    const existMerchantUser = await this.merchantUsersRepository
      .findOne({ where: { phone: data.phone } })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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
    if (!existMerchantUser) {
      const errors: RMessage = {
        value: data[data.access_type],
        property: data.access_type,
        constraint: [
          this.messageService.get('merchant.login.unregistered_phone'),
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
    let merchantLevel = '';
    let groupID = '';
    let merchantID = '';
    let storeID = '';
    const id = existMerchantUser.id;

    if (existMerchantUser.store_id != null) {
      merchantLevel = 'store';
      storeID = existMerchantUser.store_id;
    }
    if (existMerchantUser.merchant_id != null) {
      merchantLevel = 'merchant';
      merchantID = existMerchantUser.merchant_id;
    }
    if (existMerchantUser.group_id != null) {
      merchantLevel = 'group';
      groupID = existMerchantUser.group_id;
    }

    const http_req: Record<string, any> = {
      phone: data.phone,
      id_profile: merchantID,
      user_type: 'merchant',
      level: merchantLevel,
      id: id,
      group_id: groupID,
      merchant_id: merchantID,
      store_id: storeID,
      roles: ['merchant'],
      otp_code: data.otp_code,
    };

    const url: string =
      process.env.BASEURL_AUTH_SERVICE +
      '/api/v1/auth/otp-login-phone-validation';
    return (await this.postHttp(url, http_req, defaultHeadersReq)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;
        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  async loginPhoneProcess(
    data: Record<string, any>,
  ): Promise<Observable<Promise<any>>> {
    const existMerchantUser = await this.merchantUsersRepository
      .findOne({ where: { phone: data.phone } })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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
    if (!existMerchantUser) {
      const errors: RMessage = {
        value: data[data.access_type],
        property: data.access_type,
        constraint: [
          this.messageService.get('merchant.login.invalid_' + data.access_type),
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
    let merchantLevel = '';
    let merchantID = '';

    if (existMerchantUser.store_id != null) {
      merchantLevel = 'store';
      merchantID = existMerchantUser.store_id;
    }
    if (existMerchantUser.merchant_id != null) {
      merchantLevel = 'merchant';
      merchantID = existMerchantUser.merchant_id;
    }
    if (existMerchantUser.group_id != null) {
      merchantLevel = 'group';
      merchantID = existMerchantUser.group_id;
    }

    const http_req: Record<string, any> = {
      phone: data.phone,
      id_profile: merchantID,
      user_type: 'login',
      level: merchantLevel,
      id: merchantID,
      roles: ['merchant'],
    };
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-login-phone';
    return (await this.postHttp(url, http_req, defaultHeadersReq)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;
        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  async getProfile(id: string) {
    try {
      const merchant_user = await this.merchantUsersRepository
        .createQueryBuilder('mu')
        .leftJoinAndSelect('mu.store', 'merchant_store')
        .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
        .leftJoinAndSelect('mu.group', 'merchant_group')
        .where('mu.id = :id', { id })
        .andWhere('mu.role_id is not null')
        .andWhere("mu.status = 'ACTIVE'")
        .getOne();

      removeAllFieldPassword(merchant_user);
      formatingAllOutputTime(merchant_user);

      return merchant_user;
    } catch (err) {
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
    }
  }

  async loginEmailPasswordProcess(request: LoginEmailValidation): Promise<any> {
    const existMerchantUser = await this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('mu.group', 'merchant_group')
      .where('mu.email = :email', { email: request.email })
      .andWhere('mu.role_id is not null')
      .andWhere("mu.status = 'ACTIVE'")
      .getOne()
      .catch((err2) => {
        console.error(err2);
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: '',
              property: err2.column,
              constraint: [err2.message],
            },
            'Bad Request',
          ),
        );
      });
    if (!existMerchantUser) {
      const errors: RMessage = {
        value: request.email,
        property: 'email',
        constraint: [
          this.messageService.get('merchant.login.unregistered_email'),
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

    const cekPassword = await this.hashService.validatePassword(
      request.password,
      existMerchantUser.password,
    );
    if (!cekPassword) {
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          {
            value: '',
            property: 'password',
            constraint: [
              this.messageService.get('merchant.login.invalid_password'),
            ],
          },
          'Unauthorized',
        ),
      );
    }
    let merchantLevel = '';
    let groupID = '';
    let merchantID = '';
    let storeID = '';
    const id = existMerchantUser.id;

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
      const lang = request.lang || 'id';
      if (existMerchantUser.email_verified_at == null) {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: request.email,
              property: 'email',
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
    if (existMerchantUser.group_id != null) {
      if (existMerchantUser.group.status != 'ACTIVE') {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: existMerchantUser.group.status,
              property: 'group_status',
              constraint: [
                this.messageService.get('merchant.general.unverificatedUser'),
              ],
            },
            'Unauthorized',
          ),
        );
      }
      merchantLevel = 'group';
      groupID = existMerchantUser.group_id;
    }

    const http_req: Record<string, any> = {
      phone: existMerchantUser.phone,
      id_profile: merchantID,
      user_type: 'merchant',
      level: merchantLevel,
      id: id,
      group_id: groupID,
      merchant_id: merchantID,
      store_id: storeID,
      roles: ['merchant'],
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

  async loginPhonePasswordProcess(request: LoginPhoneValidation): Promise<any> {
    const existMerchantUser = await this.merchantUsersRepository
      .findOne({
        where: { phone: request.phone },
        relations: ['group', 'merchant', 'store'],
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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
    if (!existMerchantUser) {
      const errors: RMessage = {
        value: request.phone,
        property: 'phone',
        constraint: [
          this.messageService.get('merchant.login.unregistered_phone'),
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

    const cekPassword = await this.hashService.validatePassword(
      request.password,
      existMerchantUser.password,
    );
    if (!cekPassword) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'password',
            constraint: [
              this.messageService.get('merchant.login.invalid_password'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    let merchantLevel = '';
    let groupID = '';
    let merchantID = '';
    let storeID = '';
    const id = existMerchantUser.id;

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
      const lang = request.lang || 'id';
      if (existMerchantUser.phone_verified_at == null) {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: request.phone,
              property: 'phone',
              constraint: [
                this.messageService.getLang(
                  `${lang}.merchant.general.unverifiedPhone`,
                ),
              ],
            },
            'Unauthorized',
          ),
        );
      }
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
    if (existMerchantUser.group_id != null) {
      if (existMerchantUser.group.status != 'ACTIVE') {
        throw new UnauthorizedException(
          this.responseService.error(
            HttpStatus.UNAUTHORIZED,
            {
              value: existMerchantUser.group.status,
              property: 'group_status',
              constraint: [
                this.messageService.get('merchant.general.unverificatedUser'),
              ],
            },
            'Unauthorized',
          ),
        );
      }
      merchantLevel = 'group';
      groupID = existMerchantUser.group_id;
    }

    const http_req: Record<string, any> = {
      phone: existMerchantUser.phone,
      id_profile: merchantID,
      user_type: 'merchant',
      level: merchantLevel,
      id: id,
      group_id: groupID,
      merchant_id: merchantID,
      store_id: storeID,
      roles: ['merchant'],
    };

    const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/login`;
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

  async ubahPasswordProcess(
    request: UbahPasswordValidation,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    const existMerchantUser = await this.merchantUsersRepository
      .findOne({ where: { id: user.id } })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: err.column,
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

    if (!existMerchantUser) {
      const errors: RMessage = {
        value: user.id,
        property: 'token',
        constraint: [
          this.messageService.get('merchant.user.unregistered_user'),
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

    const cekPassword = await this.hashService.validatePassword(
      request.old_password,
      existMerchantUser.password,
    );
    if (!cekPassword) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'old_password',
            constraint: [
              this.messageService.get('merchant.login.invalid_password'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      request.new_password,
      salt,
    );
    existMerchantUser.password = passwordHash;
    const result = await this.merchantUsersRepository.save(existMerchantUser);
    deleteCredParam(result);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      result,
    );
  }

  async updateProfile(
    data: UpdateProfileValidation,
    user: Record<string, any>,
  ) {
    const existUser = await this.merchantUsersRepository
      .findOne({
        relations: ['group', 'merchant', 'store'],
        where: {
          id: user.id,
        },
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
    if (!existUser) {
      const errors: RMessage = {
        value: user.id,
        property: 'id',
        constraint: [
          this.messageService.get('merchant.user.unregistered_user'),
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
    if (data.name && data.name != '') existUser.name = data.name;
    if (data.nip && data.nip != '') existUser.nip = data.nip;

    const updateMerchantUser = await this.merchantUsersRepository.save(
      existUser,
    );
    const merchant: Record<string, any> =
      user.level == 'group'
        ? await this.groupRepository.findOne({
            where: { id: existUser.group_id },
          })
        : user.level == 'merchant'
        ? await this.merchantRepository.findOne({
            where: { id: existUser.merchant_id },
          })
        : await this.storeRepository.findOne({
            where: { id: existUser.store_id },
          });
    if (merchant) {
      if (user.level == 'group') {
        if (existUser.email == merchant.director_email) {
          await this.groupRepository.update(
            { id: merchant.id },
            {
              director_name: updateMerchantUser.name,
              director_nip: updateMerchantUser.nip,
            },
          );
          existUser.group.director_name = updateMerchantUser.name;
          existUser.group.director_nip = updateMerchantUser.nip;
        } else if (existUser.email == merchant.pic_operational_email) {
          await this.groupRepository.update(
            { id: merchant.id },
            {
              pic_operational_name: updateMerchantUser.name,
              pic_operational_nip: updateMerchantUser.nip,
            },
          );
          existUser.group.pic_operational_name = updateMerchantUser.name;
          existUser.group.pic_operational_nip = updateMerchantUser.nip;
        } else {
          await this.groupRepository.update(
            { id: merchant.id },
            {
              pic_finance_name: updateMerchantUser.name,
              pic_finance_nip: updateMerchantUser.nip,
            },
          );
          existUser.group.pic_finance_name = updateMerchantUser.name;
          existUser.group.pic_finance_nip = updateMerchantUser.nip;
        }
        deleteCredParam(existUser.group);
      } else if (user.level == 'merchant') {
        if (existUser.email == merchant.pic_email) {
          await this.merchantRepository.update(
            { id: merchant.id },
            {
              pic_name: updateMerchantUser.name,
              pic_nip: updateMerchantUser.nip,
            },
          );
          existUser.merchant.pic_name = updateMerchantUser.name;
          existUser.merchant.pic_nip = updateMerchantUser.nip;
        }
        deleteCredParam(existUser.merchant);
      } else if (user.level == 'store') {
        if (existUser.email == merchant.email) {
          await this.storeRepository.update(
            { id: merchant.id },
            {
              name: updateMerchantUser.name,
            },
          );
          existUser.store.name = updateMerchantUser.name;
        }
        deleteCredParam(existUser.store);
      }
    }
    deleteCredParam(existUser);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.general.success'),
      existUser,
    );
  }
}
