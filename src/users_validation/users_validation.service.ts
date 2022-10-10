import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessageService } from 'src/message/message.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { HashService } from 'src/hash/hash.service';
@Injectable()
// service user validation
export class UsersValidationService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly HashService: HashService,
    private readonly MessageService: MessageService,
    private readonly ResponseService: ResponseService,
  ) {}
  async validateUser(id: string, password: string): Promise<any> {
    const userData: any = await this.merchantUsersRepository.findOne({
      id: id,
    });
    if (!userData) {
      throw new BadRequestException(
        this.ResponseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: id,
            property: 'id',
            constraint: [this.MessageService.get('merchant.users.idNotFound')],
          },
          'Bad Request',
        ),
      );
    }
    const cekPassword = await this.HashService.validatePassword(
      password,
      userData.password,
    );
    if (!cekPassword) {
      throw new BadRequestException(
        this.ResponseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'password',
            constraint: ['Password is wrong'],
          },
          'Bad Request',
        ),
      );
    } else {
      return this.ResponseService.success(
        true,
        this.MessageService.get('merchant.general.success'),
      );
    }
  }
}
