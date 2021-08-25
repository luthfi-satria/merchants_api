import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';

@Injectable()
export class InternalService {
  constructor(
    @InjectRepository(StoreDocument)
    private readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  async findStorebyId(id: string): Promise<StoreDocument> {
    return await this.storeRepository
      .findOne({
        where: { id: id },
      })
      .then((result) => {
        if (!result) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: id,
                property: 'store_id',
                constraint: ['ID tidak ditemukan.'],
              },
              'Bad Request',
            ),
          );
        }
        return result;
      })
      .catch((err) => {
        console.error('error', err);
        const errors: RMessage = {
          value: '',
          property: '',
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
