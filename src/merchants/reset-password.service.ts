import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { randomUUID } from 'crypto';
import { RMessage } from 'src/response/response.interface';
import { HashService } from 'src/hash/hash.service';
// import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MerchantUsersValidation } from './validation/merchants_users.validation';
import { NotificationService } from 'src/common/notification/notification.service';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUserRepository: Repository<MerchantUsersDocument>,
    private readonly commonService: CommonService,
    // @Hash()
    private readonly hashService: HashService,
    private readonly notificationService: NotificationService,
  ) {}

  async resetPasswordEmail(
    args: Partial<MerchantUsersValidation>,
  ): Promise<any> {
    const cekEmail = await this.merchantUserRepository
      .findOne({
        email: args.email,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.email,
              property: 'email',
              constraint: [
                this.messageService.get('merchant.general.emailNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!cekEmail) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.email,
            property: 'email',
            constraint: [
              this.messageService.get('merchant.general.emailNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    //Generate Random String
    const token = randomUUID();
    cekEmail.token_reset_password = token;

    try {
      await this.merchantUserRepository.save(cekEmail);
      const url = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      // biarkan tanpa await karena dilakukan secara asynchronous
      this.notificationService.sendEmail(
        cekEmail.email,
        'Reset Password',
        '',
        `
      <p>Silahkan klik link berikut untuk mereset password Anda,</p>
      <a href="${url}">${url}</a>
      `,
      );

      if (process.env.NODE_ENV == 'test') {
        return { status: true, token: token, url: url };
      } else {
        return { status: true };
      }
    } catch (err) {
      console.error(err);
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
    }
  }

  async resetPasswordPhone(
    args: Partial<MerchantUsersValidation>,
  ): Promise<any> {
    const cekPhone = await this.merchantUserRepository
      .findOne({
        phone: args.phone,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: args.phone,
              property: 'phone',
              constraint: [
                this.messageService.get('merchant.general.phoneNotFound'),
              ],
            },
            'Bad Request',
          ),
        );
      });
    if (!cekPhone) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: args.phone,
            property: 'phone',
            constraint: [
              this.messageService.get('merchant.general.phoneNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    //Generate Random String
    const token = randomUUID();
    cekPhone.token_reset_password = token;

    try {
      await this.merchantUserRepository.save(cekPhone);
      const url = `${process.env.BASEURL_HERMES}/auth/create-password?t=${token}`;

      this.notificationService.sendSms(cekPhone.phone, url);

      if (process.env.NODE_ENV == 'test') {
        return { status: true, token: token, url: url };
      } else {
        return { status: true };
      }
    } catch (err) {
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
    }
  }

  async resetPasswordExec(
    args: Partial<MerchantUsersValidation>,
    qstring: Record<string, any>,
  ): Promise<any> {
    const cekToken = await this.merchantUserRepository
      .findOne({
        token_reset_password: qstring.token,
      })
      .catch(() => {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: qstring.token,
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
            value: qstring.token,
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
            value: qstring.token,
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

    if (cekToken.phone_verified_at === null) {
      cekToken.phone_verified_at = new Date();
    }

    try {
      await this.merchantUserRepository.save(cekToken);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
      );
    } catch (err) {
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
    }
  }
}