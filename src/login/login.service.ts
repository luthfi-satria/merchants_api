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

  async loginProcess(
    data: Record<string, any>,
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
    const validate: boolean = await this.hashService.validatePassword(
      data.password,
      existMerchantUser.password,
    );
    if (!validate) {
      const errors: RMessage = {
        value: '',
        property: 'password',
        constraint: [this.messageService.get('merchant.login.invalid_email')],
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
      id_profile: merchantID,
      user_type: 'merchant',
      level: merchantLevel,
      id: merchantID,
      roles: ['merchant'],
    };
    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/login';
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
        constraint: [this.messageService.get('merchant.login.invalid_phone')],
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
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-login-validation';
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
