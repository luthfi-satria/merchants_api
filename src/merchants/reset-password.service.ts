import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { CommonService } from 'src/common/common.service';
import { NotificationService } from 'src/common/notification/notification.service';
// import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { generateMessageResetPassword } from 'src/utils/general-utils';
import { Repository } from 'typeorm';
import { generateSmsResetPassword } from './../utils/general-utils';
import { MerchantUsersValidation } from './validation/merchants_users.validation';

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
      const messageResetPassword = await generateMessageResetPassword(
        cekEmail.name,
        url,
      );

      // biarkan tanpa await karena dilakukan secara asynchronous
      this.notificationService.sendEmail(
        cekEmail.email,
        'Reset Password',
        '',
        messageResetPassword,
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

      const smsMessage = await generateSmsResetPassword(cekPhone.name, url);

      this.notificationService.sendSms(cekPhone.phone, smsMessage);

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
