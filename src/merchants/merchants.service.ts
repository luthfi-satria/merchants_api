import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { ListResponse, RMessage } from 'src/response/response.interface';
import { createUrl, dbOutputTime } from 'src/utils/general-utils';
import { Repository } from 'typeorm';
import { Response } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.decorator';
import moment from 'moment';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantDocument)
    private readonly merchantRepository: Repository<MerchantDocument>,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    @Hash() private readonly hashService: HashService,
    @InjectRepository(MerchantUsersDocument)
    private readonly merchantUsersRepository: Repository<MerchantUsersDocument>,
    private httpService: HttpService, // private loginService: LoginService, // @InjectRepository(MerchantDocument) // private connection: Connection,
  ) {}

  async findMerchantById(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository
      .findOne({
        where: { id: id },
      })
      .catch((err) => {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [err.routine],
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

  async findMerchantMerchantByPhone(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { owner_phone: id },
    });
  }

  async findMerchantMerchantByEmail(id: string): Promise<MerchantDocument> {
    return await this.merchantRepository.findOne({
      where: { owner_email: id },
    });
  }

  async createMerchantMerchantProfile(
    data: Record<string, any>,
  ): Promise<Partial<MerchantDocument>> {
    if (
      typeof data.owner_dob == 'undefined' ||
      data.owner_dob.split('/').length != 3
    ) {
      const errors: RMessage = {
        value: data.owner_dob,
        property: 'owner_dob',
        constraint: ['Format tanggal tidak sesuai'],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.owner_dob = moment(moment(data.owner_dob, 'DD/MM/YYYY')).format(
      'YYYY-MM-DD',
    );
    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      data.owner_password,
      salt,
    );
    const create_merchant: Partial<MerchantDocument> = {
      group_id: data.group_id,
      name: data.name,
      lob_id: data.lob_id,
      address: data.address,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
      owner_phone: data.owner_phone,
      owner_password: passwordHash,
      owner_nik: data.owner_nik,
      owner_dob: data.owner_dob,
      owner_dob_city: data.owner_dob_city,
      owner_address: data.owner_address,
      bank_id: data.bank_id,
      bank_acc_name: data.bank_acc_name,
      bank_acc_number: data.bank_acc_number,
      tarif_pb1: data.tarif_pb1,
    };
    if (
      data.status != null &&
      data.status != '' &&
      typeof data.status != 'undefined'
    )
      create_merchant.status = data.status;
    if (
      data.owner_ktp != null &&
      data.owner_ktp != '' &&
      typeof data.owner_ktp != 'undefined'
    ) {
      create_merchant.owner_ktp = data.owner_ktp;
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: 'owner_ktp',
            constraint: [
              this.messageService.get('merchant.createstore.empty_photo'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    if (
      data.owner_face_ktp != null &&
      data.owner_face_ktp != '' &&
      typeof data.owner_face_ktp != 'undefined'
    ) {
      create_merchant.owner_face_ktp = data.owner_face_ktp;
    } else {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: null,
            property: 'owner_face_ktp',
            constraint: [
              this.messageService.get('merchant.createstore.empty_photo'),
            ],
          },
          'Bad Request',
        ),
      );
    }

    // return await this.connection.transaction(async (conn) => {
    //   try {
    return await this.merchantRepository
      .save(create_merchant)
      .then(async (result) => {
        result.owner_ktp = createUrl(result.owner_ktp);
        result.owner_face_ktp = createUrl(result.owner_face_ktp);
        dbOutputTime(result);

        const mUsers: Partial<MerchantUsersDocument> = {
          name: result.owner_name,
          email: result.owner_email,
          phone: result.owner_phone,
          password: result.owner_password,
          merchant_id: result.id,
        };
        await this.merchantUsersRepository.save(mUsers).catch((err) => {
          console.error('error', err);
        });
        const pclogdata = {
          id: result.id,
          musers_id: result.id,
        };

        await this.createCatalogs(pclogdata);
        delete result.owner_password;
        return result;
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

  //owner_name, email, phone, password
  async updateMerchantMerchantProfile(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const updateMUsers: Partial<MerchantUsersDocument> = {};
    const create_merchant: Partial<MerchantDocument> = {};
    if (
      data.owner_dob != null &&
      data.owner_dob != '' &&
      typeof data.owner_dob != 'undefined'
    ) {
      if (data.owner_dob.split('/').length < 3) {
        const errors: RMessage = {
          value: data.owner_dob,
          property: 'owner_dob',
          constraint: ['Format tanggal tidak sesuai'],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            'Bad Request',
          ),
        );
      }
      data.owner_dob = moment(moment(data.owner_dob, 'DD/MM/YYYY')).format(
        'YYYY-MM-DD',
      );
      create_merchant.owner_dob = data.owner_dob;
    }
    if (
      data.group_id != null &&
      data.group_id != '' &&
      typeof data.group_id != 'undefined'
    )
      create_merchant.group_id = data.group_id;
    if (data.name != null && data.name != '' && typeof data.name != 'undefined')
      create_merchant.name = data.name;
    if (
      data.lob_id != null &&
      data.lob_id != '' &&
      typeof data.lob_id != 'undefined'
    )
      create_merchant.lob_id = data.lob_id;
    if (
      data.address != null &&
      data.address != '' &&
      typeof data.address != 'undefined'
    )
      create_merchant.address = data.address;
    if (
      data.owner_name != null &&
      data.owner_name != '' &&
      typeof data.owner_name != 'undefined'
    ) {
      create_merchant.owner_name = data.owner_name;
      updateMUsers.name = data.owner_name;
    }
    if (
      data.owner_email != null &&
      data.owner_email != '' &&
      typeof data.owner_email != 'undefined'
    ) {
      create_merchant.owner_email = data.owner_email;
      updateMUsers.email = data.owner_email;
    }
    if (
      data.owner_phone != null &&
      data.owner_phone != '' &&
      typeof data.owner_phone != 'undefined'
    ) {
      create_merchant.owner_phone = data.owner_phone;
      updateMUsers.phone = data.owner_phone;
    }
    if (
      data.owner_password != null &&
      data.owner_password != '' &&
      typeof data.owner_password != 'undefined'
    ) {
      const salt: string = await this.hashService.randomSalt();
      const passwordHash = await this.hashService.hashPassword(
        data.owner_password,
        salt,
      );
      create_merchant.owner_password = passwordHash;
      updateMUsers.password = passwordHash;
    }
    if (
      data.owner_nik != null &&
      data.owner_nik != '' &&
      typeof data.owner_nik != 'undefined'
    )
      create_merchant.owner_nik = data.owner_nik;
    if (
      data.owner_dob_city != null &&
      data.owner_dob_city != '' &&
      typeof data.owner_dob_city != 'undefined'
    )
      create_merchant.owner_dob_city = data.owner_dob_city;
    if (
      data.owner_address != null &&
      data.owner_address != '' &&
      typeof data.owner_address != 'undefined'
    )
      create_merchant.owner_address = data.owner_address;
    if (
      data.bank_id != null &&
      data.bank_id != '' &&
      typeof data.bank_id != 'undefined'
    )
      create_merchant.bank_id = data.bank_id;
    if (
      data.bank_acc_name != null &&
      data.bank_acc_name != '' &&
      typeof data.bank_acc_name != 'undefined'
    )
      create_merchant.bank_acc_name = data.bank_acc_name;
    if (
      data.bank_acc_number != null &&
      data.bank_acc_number != '' &&
      typeof data.bank_acc_number != 'undefined'
    )
      create_merchant.bank_acc_number = data.bank_acc_number;
    if (
      data.tarif_pb1 != null &&
      data.tarif_pb1 != '' &&
      typeof data.tarif_pb1 != 'undefined'
    )
      create_merchant.tarif_pb1 = data.tarif_pb1;
    if (
      data.status != null &&
      data.status != '' &&
      typeof data.status != 'undefined'
    )
      create_merchant.status = data.status;
    if (data.status == 'ACTIVE') {
      create_merchant.approved_at = new Date();
    }
    if (
      data.owner_ktp != null &&
      data.owner_ktp != '' &&
      typeof data.owner_ktp != 'undefined'
    )
      create_merchant.owner_ktp = data.owner_ktp;
    if (
      data.owner_face_ktp != null &&
      data.owner_face_ktp != '' &&
      typeof data.owner_face_ktp != 'undefined'
    )
      create_merchant.owner_face_ktp = data.owner_face_ktp;
    return await this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .update(MerchantDocument)
      .set(create_merchant)
      .where('id= :id', { id: data.id })
      .returning('*')
      .execute()
      .then(async (response) => {
        response.raw[0].owner_ktp = createUrl(response.raw[0].owner_ktp);
        response.raw[0].owner_face_ktp = createUrl(
          response.raw[0].owner_face_ktp,
        );
        dbOutputTime(response.raw[0]);
        await this.merchantUsersRepository
          .createQueryBuilder('merchant_users')
          .update(MerchantUsersDocument)
          .set(updateMUsers)
          .where('merchant_id= :gid', { gid: data.id })
          .execute();
        delete response.raw[0].owner_password;
        return response.raw[0];
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

  async deleteMerchantMerchantProfile(data: string): Promise<any> {
    const delete_merchant: Partial<MerchantDocument> = {
      id: data,
    };
    return this.merchantRepository
      .delete(delete_merchant)
      .then(() => {
        return this.merchantUsersRepository.delete({ merchant_id: data });
      })
      .catch(() => {
        const errors: RMessage = {
          value: data,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.deletemerchant.invalid_id'),
          ],
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

  async listGroupMerchant(
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    let search = data.search || '';
    search = search.toLowerCase();
    const currentPage = data.page || 1;
    const perPage = data.limit || 10;
    let totalItems: number;

    return await this.merchantRepository
      .createQueryBuilder('merchant_merchant')
      .select('*')
      .orWhere('lower(name) like :mname', {
        mname: '%' + search + '%',
      })
      .orWhere('lower(address) like :addr', {
        addr: '%' + search + '%',
      })
      .orWhere('lower(owner_name) like :oname', {
        oname: '%' + search + '%',
      })
      .orWhere('lower(owner_email) like :omail', {
        omail: '%' + search + '%',
      })
      .orWhere('lower(owner_phone) like :ophone', {
        ophone: '%' + search + '%',
      })
      .orWhere('lower(owner_password) like :opass', {
        opass: '%' + search + '%',
      })
      .orWhere('lower(owner_nik) like :onik', {
        onik: '%' + search + '%',
      })
      .orWhere('lower(owner_dob_city) like :odc', {
        odc: '%' + search + '%',
      })
      .orWhere('lower(owner_address) like :oaddr', {
        oaddr: '%' + search + '%',
      })
      .orWhere('lower(bank_acc_name) like :ban', {
        ban: '%' + search + '%',
      })
      .orWhere('lower(bank_acc_number) like :banu', {
        banu: '%' + search + '%',
      })
      .orWhere('lower(tarif_pb1) like :tpb', {
        tpb: '%' + search + '%',
      })
      .getCount()
      .then(async (counts) => {
        totalItems = counts;
        return await this.merchantRepository
          .createQueryBuilder('merchant_merchant')
          .select('*')
          .where('lower(name) like :mname', {
            mname: '%' + search + '%',
          })
          .orWhere('lower(address) like :addr', {
            addr: '%' + search + '%',
          })
          .orWhere('lower(owner_name) like :oname', {
            oname: '%' + search + '%',
          })
          .orWhere('lower(owner_email) like :omail', {
            omail: '%' + search + '%',
          })
          .orWhere('lower(owner_phone) like :ophone', {
            ophone: '%' + search + '%',
          })
          .orWhere('lower(owner_password) like :opass', {
            opass: '%' + search + '%',
          })
          .orWhere('lower(owner_nik) like :onik', {
            onik: '%' + search + '%',
          })
          .orWhere('lower(owner_dob_city) like :odc', {
            odc: '%' + search + '%',
          })
          .orWhere('lower(owner_address) like :oaddr', {
            oaddr: '%' + search + '%',
          })
          .orWhere('lower(bank_acc_name) like :ban', {
            ban: '%' + search + '%',
          })
          .orWhere('lower(bank_acc_number) like :banu', {
            banu: '%' + search + '%',
          })
          .orWhere('lower(tarif_pb1) like :tpb', {
            tpb: '%' + search + '%',
          })
          .orderBy('created_at', 'DESC')
          .offset((currentPage - 1) * perPage)
          .limit(perPage)
          .getRawMany();
      })
      .then((result) => {
        result.forEach((row) => {
          row.owner_ktp = createUrl(row.owner_ktp);
          row.owner_face_ktp = createUrl(row.owner_face_ktp);
          dbOutputTime(row);
          row.owner_dob = moment(row.owner_dob).format('YYYY-MM DD');
          delete row.owner_password;
        });

        const list_result: ListResponse = {
          total_item: totalItems,
          limit: Number(perPage),
          current_page: Number(currentPage),
          items: result,
        };
        return list_result;
      })
      .catch((err) => {
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

  async createCatalogs(data: Record<string, any>) {
    const pcurl =
      process.env.BASEURL_CATALOG_SERVICE +
      '/api/v1/internal/menus-prices-categories';
    const pcdata = {
      merchant_id: data.id,
      name: 'Kategori 1',
    };
    const scurl =
      process.env.BASEURL_CATALOG_SERVICE +
      '/api/v1/internal/menus-sales-channels';
    const scdata = {
      merchant_id: data.id,
      name: 'EFOOD',
      platform: 'ONLINE',
    };

    this.requestToApi(pcurl, pcdata);
    this.requestToApi(scurl, scdata);
  }

  async requestToApi(url: string, data: Record<string, any>): Promise<any> {
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
    };
    return this.httpService
      .post(url, data, { headers: headersRequest })
      .subscribe(async (response) => {
        const logger = new Logger();

        logger.log(response.data, 'Reg Catalog Merchant');
        return response.data;
      });
  }
}
