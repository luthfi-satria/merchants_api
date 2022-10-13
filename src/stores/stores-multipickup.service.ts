import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';

@Injectable()
export class StoreMultipickupService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly storeRepo: Repository<StoreDocument>,
  ) {}

  private readonly logger = new Logger();

  async findStoresByRadius(param) {
    try {
      // const query = await this.storeRepo
      // .createQueryBuilder()
      // .
      return param;
    } catch (error) {
      this.logger.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.listmerchant.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  distanceCalculation(latitude: string, longitude: string ) {
    
  }
}
