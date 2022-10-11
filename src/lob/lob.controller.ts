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
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { DeleteResult } from 'typeorm';
import { LobService } from './lob.service';
import {
  MerchantLobValidation,
  UpdateLobValidation,
} from './validation/lob.validation';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { LobDocument } from 'src/database/entities/lob.entity';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';

@Controller('api/v1/merchants')
export class LobController {
  constructor(
    private readonly lobService: LobService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  @Post('lob')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createlob(
    @Body(RequestValidationPipe(MerchantLobValidation))
    data: MerchantLobValidation,
  ): Promise<any> {
    const result: LobDocument = await this.lobService.findLobByName(data.name);

    if (result) {
      const errors: RMessage = {
        value: data.name,
        property: 'name',
        constraint: [this.messageService.get('merchant.createlob.nameExist')],
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
      const result_db: LobDocument =
        await this.lobService.createMerchantLobProfile(data);
      return this.responseService.success(
        true,
        this.messageService.get('merchant.createlob.success'),
        result_db,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: 'name',
        constraint: [this.messageService.get('merchant.createlob.fail')],
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

  @Put('lob/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatelob(
    @Body()
    data: UpdateLobValidation,
    @Param('id') id: string,
  ): Promise<any> {
    const result: LobDocument = await this.lobService.findLobById(id);

    if (!result) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('merchant.updatelob.unreg')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const cekname: LobDocument = await this.lobService.findLobByName(data.name);
    if (cekname && cekname.name != result.name) {
      const errors: RMessage = {
        value: data.name,
        property: 'name',
        constraint: [this.messageService.get('merchant.createlob.nameExist')],
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
      const updateresult: Record<string, any> =
        await this.lobService.updateMerchantLobProfile(data, result);
      return this.responseService.success(
        true,
        this.messageService.get('merchant.updatelob.success'),
        updateresult,
      );
    } catch (err) {
      const errors: RMessage = {
        value: err.message,
        property: '',
        constraint: [this.messageService.get('merchant.updatelob.fail')],
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

  @Delete('lob/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async deletegroups(@Param('id') id: string): Promise<any> {
    try {
      const result: DeleteResult =
        await this.lobService.deleteMerchantLobProfile(id);
      if (result && result.affected == 0) {
        const errors: RMessage = {
          value: id,
          property: 'id',
          constraint: [
            this.messageService.get('merchant.deletelob.invalid_id'),
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
        constraint: [this.messageService.get('merchant.deletelob.invalid_id')],
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

  @Get('lob')
  // @UserType('admin', 'merchant') : kebutuhan register di mobile 
  // @AuthJwtGuard()
  @ResponseStatusCode()
  async getgroups(@Query() data: string[]): Promise<any> {
    try {
      const listgroup: any = await this.lobService.listGroup(data);
      if (!listgroup) {
        const errors: RMessage = {
          value: '',
          property: '',
          constraint: [this.messageService.get('merchant.listlob.fail')],
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
        this.messageService.get('merchant.listlob.success'),
        listgroup,
      );
    } catch (err) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('merchant.general.dataNotFound')],
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

  @Get('lob/:lid')
  @UserType('admin', 'merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async viewDetailGroups(@Param('lid') lob_id: string): Promise<any> {
    const result = await this.lobService.viewDetailGroup(lob_id);
    return this.responseService.success(
      true,
      this.messageService.get('merchant.listlob.success'),
      result,
    );
  }
}
