import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable } from 'rxjs';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { HashService } from 'src/hash/hash.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Hash } from 'src/hash/hash.decorator';
import { LoginEmailValidation } from './validation/login.email.validation';
import { OtpEmailValidateValidation } from './validation/otp.email-validate.validation';

const defaultHeadersReq: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private httpService: HttpService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async postHttp(
    url: string,
    body: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.post(url, body, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }

  async loginEmailOtpValidationProcess(
    data: OtpEmailValidateValidation,
  ): Promise<Observable<Promise<any>>> {
    // let existMerchantUser: MerchantUsersDocument;
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
    let merchantID = '';

    if (existMerchantUser.store_id != null) {
      merchantLevel = 'store';
      merchantID = existMerchantUser.store_id;
    }
    if (existMerchantUser.merchant_id != null) {
      merchantLevel = 'brand';
      merchantID = existMerchantUser.merchant_id;
    }
    if (existMerchantUser.group_id != null) {
      merchantLevel = 'corporate';
      merchantID = existMerchantUser.group_id;
    }

    const http_req: Record<string, any> = {
      phone: data.phone,
      id_profile: merchantID,
      user_type: 'merchant',
      level: merchantLevel,
      id: existMerchantUser.id,
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
      merchantLevel = 'brand';
      merchantID = existMerchantUser.merchant_id;
    }
    if (existMerchantUser.group_id != null) {
      merchantLevel = 'corporate';
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
}
