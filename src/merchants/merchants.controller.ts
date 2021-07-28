import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { MerchantsService } from './merchants.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RMessage } from 'src/response/response.interface';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MerchantMerchantValidation } from './validation/merchants.validation';
import { MerchantDocument } from 'src/database/entities/merchant.entity';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { catchError, map } from 'rxjs';
import { GroupsService } from 'src/groups/groups.service';
import { DeleteResult } from 'typeorm';
import { GroupDocument } from 'src/database/entities/group.entity';
import { LobDocument } from 'src/database/entities/lob.entity';
import { LobService } from 'src/lob/lob.service';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';

@Controller('api/v1/merchants')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly groupsService: GroupsService,
    private readonly lobService: LobService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService, // private httpService: HttpService,
  ) {}

  @Post('merchants')
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_merchants',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createmerchants(
    @Body(RequestValidationPipe(MerchantMerchantValidation))
    data: MerchantMerchantValidation,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createmerchant.invalid_token'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.groupsService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (
          response.data.payload.user_type != 'admin' &&
          response.data.payload.user_type != 'merchant'
        ) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.createmerchant.invalid_token'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }

        if (files.length > 0) {
          files.forEach(function (file) {
            data[file.fieldname] = '/upload_merchants/' + file.filename;
          });
        }
        const cekphone: MerchantDocument =
          await this.merchantsService.findMerchantMerchantByPhone(
            data.owner_phone,
          );
        if (cekphone) {
          const errors: RMessage = {
            value: data.owner_phone,
            property: 'owner_phone',
            constraint: [
              this.messageService.get('merchant.createmerchant.phoneExist'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        const cekemail: MerchantDocument =
          await this.merchantsService.findMerchantMerchantByEmail(
            data.owner_email,
          );
        if (cekemail) {
          const errors: RMessage = {
            value: data.owner_email,
            property: 'owner_email',
            constraint: [
              this.messageService.get('merchant.createmerchant.emailExist'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        const cekgroup: GroupDocument =
          await this.groupsService.findMerchantById(data.group_id);
        if (!cekgroup) {
          const errors: RMessage = {
            value: data.group_id,
            property: 'group_id',
            constraint: [
              this.messageService.get('merchant.createmerchant.empty_groupid'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        const ceklob: LobDocument = await this.lobService.findMerchantById(
          data.lob_id,
        );
        console.log(ceklob);
        if (!ceklob) {
          const errors: RMessage = {
            value: data.lob_id,
            property: 'lob_id',
            constraint: [
              this.messageService.get('merchant.createmerchant.empty_lobid'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        try {
          const result_db: MerchantDocument =
            await this.merchantsService.createMerchantMerchantProfile(data);
          return this.responseService.success(
            true,
            this.messageService.get('merchant.createmerchant.success'),
            result_db,
          );
        } catch (err) {
          const errors: RMessage = {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.createmerchant.fail'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Put('merchants/:id')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_merchants',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updatemerchants(
    @Body()
    data: Record<string, any>,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createmerchant.invalid_token'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const cekid: MerchantDocument =
      await this.merchantsService.findMerchantById(id);

    if (!cekid) {
      const errors: RMessage = {
        value: id,
        property: 'merchant_id',
        constraint: [this.messageService.get('merchant.updatemerchant.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    data.merchant_id = cekid.merchant_id;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.groupsService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (response.data.payload.user_type != 'admin') {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.createmerchant.invalid_token'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        if (files.length > 0) {
          files.forEach(function (file) {
            data[file.fieldname] = '/upload_merchants/' + file.filename;
          });
        }
        const cekphone: MerchantDocument =
          await this.merchantsService.findMerchantMerchantByPhone(
            data.owner_phone,
          );
        if (cekphone && cekphone.owner_phone != cekid.owner_phone) {
          const errors: RMessage = {
            value: data.owner_phone,
            property: 'owner_phone',
            constraint: [
              this.messageService.get('merchant.createmerchant.phoneExist'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        const cekemail: MerchantDocument =
          await this.merchantsService.findMerchantMerchantByEmail(
            data.owner_email,
          );
        if (cekemail && cekemail.owner_email != cekid.owner_email) {
          const errors: RMessage = {
            value: data.owner_email,
            property: 'owner_email',
            constraint: [
              this.messageService.get('merchant.createmerchant.emailExist'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        try {
          await this.merchantsService.updateMerchantMerchantProfile(data);
          const rdata: Record<string, any> = {
            name: cekid.name,
          };
          return this.responseService.success(
            true,
            this.messageService.get('merchant.updatemerchant.success'),
            rdata,
          );
        } catch (err) {
          const errors: RMessage = {
            value: err.message,
            property: 'updatemerchant',
            constraint: [
              this.messageService.get('merchant.updatemerchant.fail'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Delete('merchants/:id')
  async deletemerchants(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createmerchant.invalid_token'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.groupsService.getHttp(url, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        if (response.data.payload.user_type != 'admin') {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [
              this.messageService.get('merchant.createmerchant.invalid_token'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
        try {
          const result: DeleteResult =
            await this.merchantsService.deleteMerchantMerchantProfile(id);
          if (result && result.affected == 0) {
            const errors: RMessage = {
              value: id,
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
          }
          return this.responseService.success(
            true,
            this.messageService.get('merchant.deletemerchant.success'),
          );
        } catch (err) {
          const errors: RMessage = {
            value: err.message,
            property: 'deletemerchant',
            constraint: [
              this.messageService.get('merchant.deletemerchant.fail'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Get('merchants')
  async getmerchants(
    @Query() data: string[],
    // @Headers('Authorization') token: string,
  ): Promise<any> {
    // if (typeof token == 'undefined' || token == 'undefined') {
    //   const errors: RMessage = {
    //     value: '',
    //     property: 'token',
    //     constraint: [
    //       this.messageService.get('merchant.createmerchant.invalid_token'),
    //     ],
    //   };
    //   throw new BadRequestException(
    //     this.responseService.error(
    //       HttpStatus.BAD_REQUEST,
    //       errors,
    //       'Bad Request',
    //     ),
    //   );
    // }

    // const url: string =
    //   process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    // const headersRequest: Record<string, any> = {
    //   'Content-Type': 'application/json',
    //   Authorization: token,
    // };

    // return (await this.groupsService.getHttp(url, headersRequest)).pipe(
    //   map(async (response) => {
    //     const rsp: Record<string, any> = response;

    //     if (rsp.statusCode) {
    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           rsp.message[0],
    //           'Bad Request',
    //         ),
    //       );
    //     }
    //     if (response.data.payload.user_type != 'admin') {
    //       const errors: RMessage = {
    //         value: token.replace('Bearer ', ''),
    //         property: 'token',
    //         constraint: [
    //           this.messageService.get('merchant.createmerchant.invalid_token'),
    //         ],
    //       };
    //       throw new BadRequestException(
    //         this.responseService.error(
    //           HttpStatus.BAD_REQUEST,
    //           errors,
    //           'Bad Request',
    //         ),
    //       );
    //     }

    const listgroup: any = await this.merchantsService.listGroupMerchant(data);
    if (!listgroup) {
      const errors: RMessage = {
        value: '',
        property: 'listgroup',
        constraint: [this.messageService.get('merchant.listmerchant.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return this.responseService.success(
      true,
      this.messageService.get('merchant.listmerchant.success'),
      listgroup,
    );
    //   }),
    //   catchError((err) => {
    //     throw err.response.data;
    //   }),
    // );
  }
}
