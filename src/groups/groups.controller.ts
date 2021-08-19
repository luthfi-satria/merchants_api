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
  UploadedFile,
  UseInterceptors,
  Headers,
  UnauthorizedException,
  Req,
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
import { ImageValidationService } from 'src/utils/image-validation.service';

@Controller('api/v1/merchants')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly imageValidationService: ImageValidationService,
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
    @Req() req: any,
    @Body()
    data: MerchantGroupValidation,
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
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorized',
        ),
      );
    }
    this.imageValidationService.setFilter('owner_ktp', 'required');
    await this.imageValidationService.validate(req);

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
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'Unauthorized',
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
        if (!file) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              {
                value: null,
                property: 'upload_photo',
                constraint: [
                  this.messageService.get('merchant.creategroup.empty_photo'),
                ],
              },
              'Bad Request',
            ),
          );
        }
        data.owner_ktp = '/upload_groups/' + file.filename;
        const result_db: GroupDocument =
          await this.groupsService.createMerchantGroupProfile(data);
        return this.responseService.success(
          true,
          this.messageService.get('merchant.creategroup.success'),
          result_db,
        );
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
    @Req() req: any,
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
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorized',
        ),
      );
    }
    this.imageValidationService.setFilter('owner_ktp', 'required');
    await this.imageValidationService.validate(req);

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
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
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

        if (file) data.owner_ktp = '/upload_groups/' + file.filename;
        const updateresult: Record<string, any> =
          await this.groupsService.updateMerchantGroupProfile(data);
        return this.responseService.success(
          true,
          this.messageService.get('merchant.updategroup.success'),
          updateresult,
        );
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
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'UNAUTHORIZED',
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
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
            ),
          );
        }
        const result: DeleteResult =
          await this.groupsService.deleteMerchantGroupProfile(id);
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
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'UNAUTHORIZED',
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
          throw new UnauthorizedException(
            this.responseService.error(
              HttpStatus.UNAUTHORIZED,
              errors,
              'UNAUTHORIZED',
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
