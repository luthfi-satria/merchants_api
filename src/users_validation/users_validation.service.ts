import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
@Injectable()
export class UsersValidationService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private readonly hashService: HashService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}
  async validateUser(id: string, password: string): Promise<any> {
    const userData: any = await this.merchantUsersRepository.findOne({
      id: id,
    });
    if (!userData) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: id,
            property: 'id',
            constraint: [this.messageService.get('merchant.users.idNotFound')],
          },
          'Bad Request',
        ),
      );
    }
    const cekPassword = await this.hashService.validatePassword(
      password,
      userData.password,
    );
    if (!cekPassword) {
      throw new BadRequestException(
        this.responseService.error(
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
      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
      );
    }
  }
}
