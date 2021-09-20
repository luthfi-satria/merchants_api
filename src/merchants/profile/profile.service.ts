import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { catchError, map, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { UpdateEmailDto, UpdatePhoneDto } from './validation/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantRepository: Repository<MerchantUsersDocument>,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private httpService: HttpService,
  ) {}

  async findOneMerchantByEmail(email: string): Promise<MerchantUsersDocument> {
    return await this.merchantRepository.findOne({ where: { email: email } });
  }

  async findOneMerchantByPhone(phone: string): Promise<MerchantUsersDocument> {
    return await this.merchantRepository.findOne({ phone: phone });
  }

  async findOneById(id: string): Promise<MerchantUsersDocument> {
    return await this.merchantRepository.findOne({ where: { id: id } });
  }

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

  async updateEmail(data: UpdateEmailDto): Promise<MerchantUsersDocument> {
    const admin = new MerchantUsersDocument();
    admin.id = data.id;
    admin.email = data.email;
    const result = await this.merchantRepository.save(admin);
    if (result) {
      return this.merchantRepository.findOne(result.id);
    }
  }

  async updatePhone(data: UpdatePhoneDto): Promise<MerchantUsersDocument> {
    const admin = new MerchantUsersDocument();
    admin.id = data.id;
    admin.phone = data.phone;
    const result = await this.merchantRepository.save(admin);
    if (result) {
      return this.merchantRepository.findOne(result.id);
    }
  }
}
