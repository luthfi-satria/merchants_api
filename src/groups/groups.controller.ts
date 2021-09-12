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
  UseInterceptors,
  Headers,
  UnauthorizedException,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import {
  CategoryGroup,
  GroupDocument,
} from 'src/database/entities/group.entity';
import { RMessage } from 'src/response/response.interface';
import { diskStorage } from 'multer';
import { editFileName, imageAndPdfFileFilter } from 'src/utils/general-utils';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { GroupsService } from './groups.service';
import { catchError, map } from 'rxjs';
import { DeleteResult } from 'typeorm';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { CreateGroupDTO } from './validation/create_groups.dto';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { UpdateGroupDTO } from './validation/update_groups.dto';

@Controller('api/v1/merchants')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly imageValidationService: ImageValidationService,
    private readonly storage: CommonStorageService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('groups')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_groups',
        filename: editFileName,
      }),
      fileFilter: imageAndPdfFileFilter,
    }),
  )
  async creategroups(
    @Req() req: any,
    @Body()
    createGroupDTO: CreateGroupDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (createGroupDTO.category == CategoryGroup.COMPANY) {
      this.imageValidationService.setFilter('siup_file', 'required');
      this.imageValidationService.setFilter('akta_pendirian_file', 'required');
      this.imageValidationService.setFilter('akta_perubahan_file', 'required');
      this.imageValidationService.setFilter('npwp_file', 'required');
    } else if (createGroupDTO.category == CategoryGroup.PERSONAL) {
      this.imageValidationService.setFilter(
        'director_id_face_file',
        'required',
      );
    }
    this.imageValidationService.setFilter('director_id_file', 'required');
    await this.imageValidationService.validate(req);

    const group = await this.groupsService.findMerchantByPhone(
      createGroupDTO.phone,
    );
    if (group) {
      const errors: RMessage = {
        value: createGroupDTO.phone,
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

    for (let i = 0; i < files.length; i++) {
      const file_name = '/upload_groups/' + files[i].filename;
      const url = await this.storage.store(file_name);
      createGroupDTO[files[i].fieldname] = url;
    }

    try {
      const create_result: GroupDocument =
        await this.groupsService.createMerchantGroupProfile(createGroupDTO);
      const result: Record<string, any> = { ...create_result };
      for (let i = 0; i < create_result.users.length; i++) {
        const url = `${process.env.BASEURL_HERMES}/auth/create-password?t=${create_result.users[i].token_reset_password}`;
        result.users[i].url_reset_password = url;
      }
      return this.responseService.success(
        true,
        this.messageService.get('merchant.creategroup.success'),
        result,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @Put('groups/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_groups',
        filename: editFileName,
      }),
      fileFilter: imageAndPdfFileFilter,
    }),
  )
  async updategroups(
    @Req() req: any,
    @Body()
    updateGroupDTO: UpdateGroupDTO,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    await this.imageValidationService.validate(req);

    const group: GroupDocument = await this.groupsService.findMerchantById(id);
    if (!group) {
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

    const cekphone: GroupDocument =
      await this.groupsService.findMerchantByPhoneExceptId(
        updateGroupDTO.phone,
        id,
      );
    if (cekphone && cekphone.phone != updateGroupDTO.phone) {
      const errors: RMessage = {
        value: updateGroupDTO.phone,
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

    for (let i = 0; i < files.length; i++) {
      const file_name = '/upload_groups/' + files[i].filename;
      const url = await this.storage.store(file_name);
      updateGroupDTO[files[i].fieldname] = url;
    }
    try {
      const updateresult: Record<string, any> =
        await this.groupsService.updateMerchantGroupProfile(updateGroupDTO, id);
      return this.responseService.success(
        true,
        this.messageService.get('merchant.updategroup.success'),
        updateresult,
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          error.message,
          'Bad Request',
        ),
      );
    }
  }

  @Delete('groups/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deletegroups(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
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
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getgroups(
    @Query() data: string[],
    @Headers('Authorization') token: string,
  ): Promise<any> {
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
