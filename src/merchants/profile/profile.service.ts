import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { catchError, map, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  UbahEmailDto,
  UpdateEmailDto,
  UpdatePhoneDto,
  VerifikasiUbahEmailDto,
  VerifikasiUbahPhoneDto,
} from './validation/profile.dto';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { randomUUID } from 'crypto';
import {
  formatingAllOutputTime,
  removeAllFieldPassword,
} from 'src/utils/general-utils';
import { NotificationService } from 'src/common/notification/notification.service';
import { HashService } from 'src/hash/hash.service';
// import { Hash } from 'src/hash/hash.decorator';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantRepository: Repository<MerchantUsersDocument>,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private httpService: HttpService,
    private readonly notificationService: NotificationService,
    // @Hash()
    private readonly hashService: HashService,
  ) {}

  async findOneMerchantByEmail(email: string): Promise<MerchantUsersDocument> {
    return this.merchantRepository.findOne({ where: { email: email } });
  }

  async findOneMerchantByPhone(phone: string): Promise<MerchantUsersDocument> {
    return this.merchantRepository.findOne({ phone: phone });
  }

  async findOneById(id: string): Promise<MerchantUsersDocument> {
    return this.merchantRepository.findOne({ where: { id: id } });
  }

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

  async updateEmail(data: UpdateEmailDto): Promise<MerchantUsersDocument> {
    const merchantUser = new MerchantUsersDocument();
    merchantUser.id = data.id;
    merchantUser.email = data.email;
    merchantUser.email_verified_at = new Date();
    const result = await this.merchantRepository.save(merchantUser);
    if (result) {
      return this.merchantRepository.findOne(result.id);
    }
  }

  async updatePhone(data: UpdatePhoneDto): Promise<MerchantUsersDocument> {
    const merchantUser = new MerchantUsersDocument();
    merchantUser.id = data.id;
    merchantUser.phone = data.phone;
    merchantUser.phone_verified_at = new Date();
    const result = await this.merchantRepository.save(merchantUser);
    if (result) {
      return this.merchantRepository.findOne(result.id);
    }
  }

  async ubahEmail(
    data: UbahEmailDto,
    user: Record<string, any>,
  ): Promise<RSuccessMessage> {
    const existEmail = await this.merchantRepository.findOne({
      where: { email: data.email },
    });
    if (existEmail) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [this.messageService.get('merchant.general.emailExist')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const userAccount = await this.merchantRepository.findOne(user.id);
    if (!userAccount) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user.id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    userAccount.email = data.email;
    userAccount.email_verified_at = null;
    const token = randomUUID();
    userAccount.token_reset_password = token;

    try {
      const result: Record<string, any> = await this.merchantRepository.save(
        userAccount,
      );
      removeAllFieldPassword(result);
      formatingAllOutputTime(result);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/email-verification?t=${token}`;
      if (process.env.NODE_ENV == 'test') {
        result.token_reset_password = token;
        result.url = urlVerification;
      }
      this.notificationService.sendEmail(
        data.email,
        'Verifikasi Email baru',
        urlVerification,
      );

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (err) {
      console.error('catch error: ', err);
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

  async resendEmailUser(user_id: string): Promise<RSuccessMessage> {
    const userAccount = await this.merchantRepository.findOne(user_id);
    if (!userAccount) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: user_id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.general.idNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    userAccount.email_verified_at = null;
    const token = randomUUID();
    userAccount.token_reset_password = token;

    try {
      const result: Record<string, any> = await this.merchantRepository.save(
        userAccount,
      );
      removeAllFieldPassword(result);
      formatingAllOutputTime(result);

      const urlVerification = `${process.env.BASEURL_HERMES}/auth/email-verification?t=${token}`;
      if (process.env.NODE_ENV == 'test') {
        result.token_reset_password = token;
        result.url = urlVerification;
      }
      this.notificationService.sendEmail(
        userAccount.email,
        'Verifikasi Ulang Email',
        urlVerification,
      );

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (err) {
      console.error('catch error: ', err);
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

  async verifikasiUbahEmail(
    data: VerifikasiUbahEmailDto,
  ): Promise<RSuccessMessage> {
    const cekToken = await this.merchantRepository
      .findOne({
        token_reset_password: data.token,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: data.token,
              property: 'token',
              constraint: [
                this.messageService.get('merchant.general.dataNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!cekToken) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: data.token,
            property: 'token',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    if (cekToken.token_reset_password == null) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: data.token,
            property: 'token',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    cekToken.email_verified_at = new Date();
    cekToken.token_reset_password = null;

    return this.merchantRepository
      .save(cekToken)
      .then(() => {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
        );
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
  }

  async verifikasiUbahTelepon(
    args: Partial<VerifikasiUbahPhoneDto>,
  ): Promise<any> {
    const cekToken = await this.merchantRepository
      .findOne({
        token_reset_password: args.token,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.token,
              property: 'token',
              constraint: [
                this.messageService.get('merchant.general.dataNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!cekToken) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.token,
            property: 'token',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    if (cekToken.token_reset_password == null) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.token,
            property: 'token',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      args.password,
      salt,
    );
    cekToken.password = passwordHash;
    cekToken.token_reset_password = null;
    cekToken.phone_verified_at = new Date();

    return this.merchantRepository
      .save(cekToken)
      .then(() => {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.general.success'),
        );
      })
      .catch((err2) => {
        const errors: RMessage = {
          value: '',
          property: err2.column,
          constraint: [err2.message],
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
}
