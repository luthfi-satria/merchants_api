import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { GroupDocument } from 'src/database/entities/group.entity';
import { RMessage } from 'src/response/response.interface';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupsService } from './groups.service';
import { MerchantGroupValidation } from './validation/groups.validation';
import { catchError, map } from 'rxjs';
import { DeleteResult } from 'typeorm';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';

@Controller('api/v1/merchants')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('groups')
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('owner_ktp', {
      storage: diskStorage({
        destination: './upload_groups',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async creategroups(
    @Body(RequestValidationPipe(MerchantGroupValidation))
    data: MerchantGroupValidation,
    @UploadedFile() file: Express.Multer.File,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const logger = new Logger();
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.creategroup.invalid_token'),
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
              this.messageService.get('merchant.creategroup.invalid_token'),
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

        const result: GroupDocument =
          await this.groupsService.findMerchantByPhone(data.phone);

        if (result) {
          const errors: RMessage = {
            value: data.phone,
            property: 'phone',
            constraint: [
              this.messageService.get('merchant.creategroup.phoneExist'),
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

        const cekemail: GroupDocument =
          await this.groupsService.findMerchantByEmail(data.email);

        if (cekemail) {
          const errors: RMessage = {
            value: data.email,
            property: 'email',
            constraint: [
              this.messageService.get('merchant.creategroup.emailExist'),
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
          logger.debug(file, 'file');
          if (file) data.owner_ktp = '/upload_groups/' + file.filename;
          const result_db: GroupDocument =
            await this.groupsService.createMerchantGroupProfile(data);
          return this.responseService.success(
            true,
            this.messageService.get('merchant.creategroup.success'),
            result_db,
          );
        } catch (err) {
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
        }
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Put('groups/:id')
  @ResponseStatusCode()
  @UseInterceptors(
    FileInterceptor('owner_ktp', {
      storage: diskStorage({
        destination: './upload_groups',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updategroups(
    @Body()
    data: Record<string, any>,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.creategroup.invalid_token'),
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
    const result: GroupDocument = await this.groupsService.findMerchantById(id);

    if (!result) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('merchant.updategroup.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    data.id = result.id;
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
              this.messageService.get('merchant.creategroup.invalid_token'),
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

        const cekphone: GroupDocument =
          await this.groupsService.findMerchantByPhone(data.phone);

        if (cekphone && cekphone.phone != result.phone) {
          const errors: RMessage = {
            value: data.phone,
            property: 'phone',
            constraint: [
              this.messageService.get('merchant.creategroup.phoneExist'),
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

        const cekemail: GroupDocument =
          await this.groupsService.findMerchantByEmail(data.email);
        if (cekemail && cekemail.email != result.email) {
          const errors: RMessage = {
            value: data.email,
            property: 'email',
            constraint: [
              this.messageService.get('merchant.creategroup.emailExist'),
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
          if (file) data.owner_ktp = '/upload_groups/' + file.filename;
          const updateresult: Record<string, any> =
            await this.groupsService.updateMerchantGroupProfile(data);
          return this.responseService.success(
            true,
            this.messageService.get('merchant.updategroup.success'),
            updateresult,
          );
        } catch (err) {
          const errors: RMessage = {
            value: err.message,
            property: '',
            constraint: [this.messageService.get('merchant.updategroup.fail')],
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

  @Delete('groups/:id')
  @ResponseStatusCode()
  async deletegroups(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.creategroup.invalid_token'),
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
              this.messageService.get('merchant.creategroup.invalid_token'),
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
            await this.groupsService.deleteMerchantGroupProfile(id);
          console.log(result);
          if (result && result.affected == 0) {
            const errors: RMessage = {
              value: id,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.deletegroup.invalid_id'),
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
            this.messageService.get('merchant.deletegroup.success'),
          );
        } catch (err) {
          const errors: RMessage = {
            value: id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.deletegroup.invalid_id'),
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

  @Get('groups')
  @ResponseStatusCode()
  async getgroups(
    @Query() data: string[],
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.creategroup.invalid_token'),
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
              this.messageService.get('merchant.creategroup.invalid_token'),
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
        const listgroup: any = await this.groupsService.listGroup(data);
        if (!listgroup) {
          const errors: RMessage = {
            value: '',
            property: 'listgroup',
            constraint: [this.messageService.get('merchant.listgroup.fail')],
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
          this.messageService.get('merchant.listgroup.success'),
          listgroup,
        );
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }
}
