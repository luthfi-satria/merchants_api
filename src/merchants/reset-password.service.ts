import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { randomUUID } from 'crypto';
import { RMessage } from 'src/response/response.interface';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantMerchantValidation } from './validation/merchants.validation';
import { MerchantDocument } from 'src/database/entities/merchant.entity';

@Injectable()
export class ResetPasswordService {
  constructor(
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    private readonly commonService: CommonService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async resetPasswordEmail(
    args: Partial<MerchantMerchantValidation>,
  ): Promise<any> {
    const cekEmail = await this.merchantRepository
      .findOne({
        owner_email: args.email,
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
    return await this.merchantRepository
      .save(cekEmail)
      .then(() => {
        if (process.env.NODE_ENV == 'test') {
          return { status: true, token: token };
        } else {
          return { status: true };
        }
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

  async resetPasswordExec(
    args: Partial<MerchantMerchantValidation>,
    qstring: Record<string, any>,
  ): Promise<any> {
    const cekToken = await this.merchantRepository
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

    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      args.password,
      salt,
    );
    cekToken.owner_password = passwordHash;
    cekToken.token_reset_password = '';

    return await this.merchantRepository
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
}
