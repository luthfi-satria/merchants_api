import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserTypeAndLevel } from 'src/auth/guard/user-type-and-level.decorator';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { NotificationService } from 'src/common/notification/notification.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import {
  CategoryGroup,
  GroupDocument,
} from 'src/database/entities/group.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { ResponseExcludeData } from 'src/response/response_exclude_param.interceptor';
import { editFileName, imageAndPdfFileFilter } from 'src/utils/general-utils';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { DeleteResult } from 'typeorm';
import { GroupsService } from './groups.service';
import { CreateGroupDTO } from './validation/create_groups.dto';
import { ListGroupDTO } from './validation/list-group.validation';
import { UpdateGroupDTO } from './validation/update_groups.dto';
import { Response } from 'express';
import etag from 'etag';
import { UpdateCorporateDto } from './validation/update-corporate.dto';
import { GroupUsersService } from './group_users.service';
import { RejectCorporateDto } from './validation/reject-corporate.dto';
import { CountGroupDto } from './validation/count-group.dto';

@Controller('api/v1/merchants')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly imageValidationService: ImageValidationService,
    private readonly storage: CommonStorageService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
    private readonly groupsUsersService: GroupUsersService,
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
      limits: {
        fileSize: 5242880, //5MB
      },
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
      this.imageValidationService.setFilter('npwp_file', 'required');
    } else if (createGroupDTO.category == CategoryGroup.PERSONAL) {
      this.imageValidationService.setFilter(
        'director_id_face_file',
        'required',
      );
    }
    this.imageValidationService.setFilter('director_id_file', 'required');
    await this.imageValidationService.validate(req);

    const group = await this.groupsService.findGroupByPhone(
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

    for (const file of files) {
      const file_name = '/upload_groups/' + file.filename;
      const url = await this.storage.store(file_name);
      createGroupDTO[file.fieldname] = url;
    }

    const create_result: GroupDocument =
      await this.groupsService.createMerchantGroupProfile(createGroupDTO);

    await this.groupsService.manipulateGroupUrl(create_result);

    const result: Record<string, any> = { ...create_result };
    for (let i = 0; i < create_result.users.length; i++) {
      const url = `${process.env.BASEURL_HERMES}/auth/phone-verification?t=${create_result.users[i].token_reset_password}`;
      result.users[i].url_reset_password = url;
    }
    return this.responseService.success(
      true,
      this.messageService.get('merchant.creategroup.success'),
      result,
    );
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
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageAndPdfFileFilter,
    }),
  )
  async updategroups(
    @Req() req: any,
    @Body()
    updateGroupDTO: UpdateGroupDTO,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    await this.imageValidationService.validate(req);

    const group: GroupDocument = await this.groupsService.findGroupById(id);
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
      await this.groupsService.findGroupByPhoneExceptId(
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

    if (files) {
      for (const file of files) {
        const file_name = '/upload_groups/' + file.filename;
        const url = await this.storage.store(file_name);
        updateGroupDTO[file.fieldname] = url;
      }
    }
    try {
      const updateresult: GroupDocument =
        await this.groupsService.updateMerchantGroupProfile(updateGroupDTO, id);

      await this.groupsService.manipulateGroupUrl(updateresult);

      return this.responseService.success(
        true,
        this.messageService.get('merchant.updategroup.success'),
        updateresult,
      );
    } catch (error) {
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
  async deletegroups(@Param('id') id: string): Promise<any> {
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
  }

  @Get('groups/count-corporate')
  @UserTypeAndLevel('admin.*', 'merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async countCorporate(
    @Req() req: any,
    @Query() query: CountGroupDto,
  ): Promise<any> {
    try {
      const result = await this.groupsService.countCorporate(req.user, query);
      if (result) {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.count_group.success'),
          result,
        );
      }
    } catch (error) {
      const errors: RMessage = {
        value: '',
        property: 'count_group',
        constraint: [this.messageService.get('merchant.count_group.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  @Get('groups/:id')
  @UserTypeAndLevel('admin.*', 'merchant.group')
  @AuthJwtGuard()
  @UseInterceptors(ResponseExcludeData)
  @ResponseStatusCode()
  async viewGroups(@Req() req: any, @Param('id') id: string): Promise<any> {
    return this.groupsService.viewGroupDetail(id, req.user);
  }

  @Get('groups')
  @UserTypeAndLevel('admin.*', 'merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getgroups(@Req() req: any, @Query() data: ListGroupDTO): Promise<any> {
    try {
      const listgroup: any = await this.groupsService.listGroup(data, req.user);
      return this.responseService.success(
        true,
        this.messageService.get('merchant.listgroup.success'),
        listgroup,
      );
    } catch (error) {
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
  }

  @Get('groups/:doc/:id/image/:image')
  async streamFile(
    @Param('id') id: string,
    @Param('doc') doc: string,
    @Param('image') fileName: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const data = { id, doc, fileName };
    let images = null;

    try {
      images = await this.groupsService.getGroupBufferS3(data);
    } catch (error) {
      console.error(error);
      throw error;
    }

    const tag = etag(images.buffer);
    if (req.headers['if-none-match'] && req.headers['if-none-match'] === tag) {
      throw new HttpException('Not Modified', HttpStatus.NOT_MODIFIED);
    }

    res.set({
      'Content-Type': images.type + '/' + images.ext,
      'Content-Length': images.buffer.length,
      ETag: tag,
    });

    images.stream.pipe(res);
  }

  @Put('group/:group_id/rejected')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async rejectedCorporate(
    @Param('group_id') group_id: string,
    @Body() rejectDto: RejectCorporateDto,
  ) {
    try {
      const result: any = await this.groupsService.rejectedCorporate(group_id, rejectDto);
      
      if (!result) {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.updategroup.fail'),
          result,
        );
      }

      return this.responseService.success(
        true,
        this.messageService.get('merchant.updategroup.success'),
        result,
      );
    } catch (error) {
      const errors: RMessage = {
        value: '',
        property: 'updategroup',
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
  }

  @Put('group/:group_id/accepted')
  @UserTypeAndLevel('admin.*')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async acceptedCorporate(
    @Param('group_id') group_id: string
  ) {
    try {
      const result: any = await this.groupsService.acceptedCorporate(group_id);
      
      if (!result) {
        return this.responseService.success(
          true,
          this.messageService.get('merchant.updategroup.fail'),
          result,
        );
      }

      return this.responseService.success(
        true,
        this.messageService.get('merchant.updategroup.success'),
        result,
      );
    } catch (error) {
      const errors: RMessage = {
        value: '',
        property: 'updategroup',
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
  }

  @Put('group')
  @UserTypeAndLevel('merchant.group')
  @AuthJwtGuard()
  @ResponseStatusCode()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './upload_groups',
        filename: editFileName
      }),
      limits: {
        fileSize: 5242880, //5MB
      },
      fileFilter: imageAndPdfFileFilter,
    })
  )
  async updateCorporate(
    @Req() req: any,
    @Body() updateCorporateDto: UpdateCorporateDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    const checkGroup = await this.groupsService.viewGroupDetail(req.user.group_id, req.user);
    if (!checkGroup) {
      const errors: RMessage = {
        value: '',
        property: 'phone',
        constraint: [
          this.messageService.get('merchant.general.dataNotFound'),
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
    console.log(checkGroup)

    if (
      updateCorporateDto.name !==
      checkGroup.data.name
    ) {
      await this.groupsService.validateGroupUniqueName(
        updateCorporateDto.name
      )
    }

    if (
      updateCorporateDto.phone !==
      checkGroup.data.phone
    ) {
      await this.groupsService.validateGroupUniquePhone(
        updateCorporateDto.phone
      )
    }

    if (
      updateCorporateDto.director_email !==
      checkGroup.data.director_email
    ) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        updateCorporateDto.director_email,
        null,
        'director_email',
      )
    }


    if (
      updateCorporateDto.pic_finance_email !==
      checkGroup.data.pic_finance_email
    ) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        updateCorporateDto.pic_finance_email,
        null,
        'pic_finance_email',
      );
    }

    if (
      updateCorporateDto.pic_operational_email !==
      checkGroup.data.pic_operational_email
    ) {
      await this.groupsUsersService.validateGroupUserUniqueEmail(
        updateCorporateDto.pic_operational_email,
        null,
        'pic_operational_email',
      );
    }

    if (
      updateCorporateDto.director_phone !==
      checkGroup.data.director_phone
    ) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        updateCorporateDto.director_phone,
        null,
        'director_phone',
      );
    }

    if (
      updateCorporateDto.pic_finance_phone !==
      checkGroup.data.pic_finance_phone
    ) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        updateCorporateDto.pic_finance_phone,
        null,
        'pic_finance_phone',
      );
    }

    if (
      updateCorporateDto.pic_operational_phone !==
      checkGroup.data.pic_operational_phone
    ) {
      await this.groupsUsersService.validateGroupUserUniquePhone(
        updateCorporateDto.pic_operational_phone,
        null,
        'pic_operational_phone',
      );
    }

    if(files) {
      for (const file of files) {
        const file_name = '/upload_groups/' + file.filename;
        const url = await this.storage.store(file_name);
        updateCorporateDto[file.fieldname] = url;
      }
    }

    await this.groupsService.updateCorporate(
      checkGroup.data,
      updateCorporateDto
    )

    const viewGroupDetail = await this.groupsService.viewGroupDetail(checkGroup.data.id, req.user);
    // console.log('updatecor', updateCorporate)

    return this.responseService.success(
      true,
      this.messageService.get('merchant.updategroup.success'),
      viewGroupDetail.data,
    );
  }
}