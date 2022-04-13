import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
// import { Hash } from 'src/hash/hash.decorator';
import {
  LoginEmailValidation,
  VerifyLoginDto,
} from './validation/login.email.validation';
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
import { StoresService } from 'src/stores/stores.service';

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
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly commonService: CommonService,
    private readonly storesService: StoresService,
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

  async getProfile(user: any) {
    try {
      const query = this.merchantUsersRepository
        .createQueryBuilder('mu')
        .leftJoinAndSelect('mu.store', 'merchant_store')
        .leftJoinAndSelect(
          'merchant_store.service_addons',
          'merchant_store_service_addons',
        )
        .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
        .leftJoinAndSelect('merchant_merchant.group', 'merchant_merchant_group')
        .leftJoinAndSelect('mu.group', 'merchant_group');
      if (user.level == 'store') {
        query
          .leftJoinAndSelect('merchant_store.merchant', 'merchant')
          .leftJoinAndSelect('merchant.group', 'group')
          .where('mu.store_id = :sid', { sid: user.store_id });
      }
      if (user.level == 'merchant') {
        query
          .leftJoinAndSelect('merchant_merchant.group', 'group')
          .where('mu.merchant_id = :mid', { mid: user.merchant_id });
      }
      if (user.level == 'group') {
        query.where('mu.group_id = :gid', { gid: user.group_id });
      }
      query
        // .where('mu.id = :id', { id: levelId })
        .andWhere('mu.role_id is not null')
        .andWhere("mu.status = 'ACTIVE'");

      const merchant_user = await query.getOne();
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

    if (existMerchantUser.status === 'WAITING_FOR_APPROVAL') {
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          {
            value: 'WAITING_FOR_APPROVAL',
            property: 'status',
            constraint: [
              this.messageService.get('merchant.login.waiting_approval'),
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
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('mu.group', 'merchant_group')
      .where('mu.phone = :phone', { phone: request.phone })
      .andWhere('mu.role_id is not null')
      .andWhere("mu.status = 'ACTIVE'")
      .getOne()
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
  ): Promise<MerchantUsersDocument> {
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
    // const merchant: Record<string, any> =
    //   user.level == 'group'
    //     ? await this.groupRepository.findOne({
    //         where: { id: existUser.group_id },
    //       })
    //     : user.level == 'merchant'
    //     ? await this.merchantRepository.findOne({
    //         where: { id: existUser.merchant_id },
    //       })
    //     : await this.storeRepository.findOne({
    //         where: { id: existUser.store_id },
    //       });
    // console.log('merchant: ', merchant);
    // if (merchant) {
    //   if (user.level == 'group') {
    //     if (existUser.email == merchant.director_email) {
    //       await this.groupRepository.update(
    //         { id: merchant.id },
    //         {
    //           director_name: updateMerchantUser.name,
    //           director_nip: updateMerchantUser.nip,
    //         },
    //       );
    //       existUser.group.director_name = updateMerchantUser.name;
    //       existUser.group.director_nip = updateMerchantUser.nip;
    //     } else if (existUser.email == merchant.pic_operational_email) {
    //       await this.groupRepository.update(
    //         { id: merchant.id },
    //         {
    //           pic_operational_name: updateMerchantUser.name,
    //           pic_operational_nip: updateMerchantUser.nip,
    //         },
    //       );
    //       existUser.group.pic_operational_name = updateMerchantUser.name;
    //       existUser.group.pic_operational_nip = updateMerchantUser.nip;
    //     } else {
    //       await this.groupRepository.update(
    //         { id: merchant.id },
    //         {
    //           pic_finance_name: updateMerchantUser.name,
    //           pic_finance_nip: updateMerchantUser.nip,
    //         },
    //       );
    //       existUser.group.pic_finance_name = updateMerchantUser.name;
    //       existUser.group.pic_finance_nip = updateMerchantUser.nip;
    //     }
    //     deleteCredParam(existUser.group);
    //   } else if (user.level == 'merchant') {
    //     if (existUser.email == merchant.pic_email) {
    //       await this.merchantRepository.update(
    //         { id: merchant.id },
    //         {
    //           pic_name: updateMerchantUser.name,
    //           pic_nip: updateMerchantUser.nip,
    //         },
    //       );
    //       existUser.merchant.pic_name = updateMerchantUser.name;
    //       existUser.merchant.pic_nip = updateMerchantUser.nip;
    //     }
    //     deleteCredParam(existUser.merchant);
    //   } else if (user.level == 'store') {
    //     if (existUser.email == merchant.email) {
    //       const updateStoreData: Partial<StoreDocument> = {
    //         id: merchant.id,
    //         name: updateMerchantUser.name,
    //       };
    //       await this.storesService.updateStorePartial(updateStoreData);
    //       existUser.store.name = updateMerchantUser.name;
    //     }
    //     deleteCredParam(existUser.store);
    //   }
    // }
    // deleteCredParam(existUser);

    return updateMerchantUser;
  }

  async refreshToken(token: string): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/refresh-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
      'request-from': 'merchant',
    };
    const http_req: Record<string, any> = {
      user_type: 'merchant',
      roles: ['merchant'],
    };

    const resp: Record<string, any> = await this.commonService.postHttp(
      url,
      http_req,
      headersRequest,
    );
    if (resp.statusCode) {
      throw resp;
    } else {
      return resp;
    }
  }

  async verifyLogin(data: VerifyLoginDto): Promise<MerchantUsersDocument> {
    const existMerchantUser = await this.merchantUsersRepository
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.store', 'merchant_store')
      .leftJoinAndSelect('mu.merchant', 'merchant_merchant')
      .leftJoinAndSelect('mu.group', 'merchant_group')
      .where('mu.id = :muid', { muid: data.user_id })
      .andWhere('mu.role_id is not null')
      .andWhere("mu.status = 'ACTIVE'")
      .getOne()
      .catch((err3) => {
        console.error(err3);
        throw new NotFoundException(
          this.responseService.error(
            HttpStatus.NOT_FOUND,
            {
              value: '',
              property: err3.column,
              constraint: [err3.message],
            },
            'NOT_FOUND',
          ),
        );
      });
    if (!existMerchantUser) {
      const errors: RMessage = {
        value: data.user_id,
        property: 'user_id',
        constraint: [this.messageService.get('merchant.general.idNotFound')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Unauthorized',
        ),
      );
    }

    const cekPassword = await this.hashService.validatePassword(
      data.password,
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
          'Unauthorized',
        ),
      );
    }

    if (existMerchantUser.status === 'WAITING_FOR_APPROVAL') {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: 'WAITING_FOR_APPROVAL',
            property: 'status',
            constraint: [
              this.messageService.get('merchant.login.waiting_approval'),
            ],
          },
          'Unauthorized',
        ),
      );
    }
    const lang = 'id';

    if (existMerchantUser.email_verified_at == null) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: existMerchantUser.email,
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

    let level = '';
    if (existMerchantUser.store_id != null) {
      if (existMerchantUser.store.status != 'ACTIVE') {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
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
      level = 'store';
    }
    if (existMerchantUser.merchant_id != null) {
      if (
        existMerchantUser.status != 'ACTIVE' ||
        existMerchantUser.merchant.status != 'ACTIVE'
      ) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
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
      level = 'merchant';
    }
    if (existMerchantUser.group_id != null) {
      if (existMerchantUser.group.status != 'ACTIVE') {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
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
      level = 'group';
    }

    return this.getProfile({ id: existMerchantUser.id, level: level });
  }
}
