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
  Headers,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { RMessage } from 'src/response/response.interface';
import { catchError, map } from 'rxjs';
import { DeleteResult } from 'typeorm';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
// import { AddonDocument } from 'src/database/entities/lob.entity';
import { AddonsService } from './addons.service';
import { MerchantAddonsValidation } from './validation/addons.validation';
import { AddonDocument } from 'src/database/entities/addons.entity';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';

@Controller('api/v1/merchants')
export class AddonsController {
  constructor(
    private readonly addonService: AddonsService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('addons')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async createaddon(
    @Body(RequestValidationPipe(MerchantAddonsValidation))
    data: MerchantAddonsValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.addonService.getHttp(url, headersRequest)).pipe(
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

        const result: AddonDocument = await this.addonService.findAddonByName(
          data.name,
        );

        if (result) {
          const errors: RMessage = {
            value: data.name,
            property: 'name',
            constraint: [
              this.messageService.get('merchant.createaddon.nameExist'),
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
          const result_db: AddonDocument =
            await this.addonService.createMerchantAddonProfile(data);
          return this.responseService.success(
            true,
            this.messageService.get('merchant.createaddon.success'),
            result_db,
          );
        } catch (err) {
          const errors: RMessage = {
            value: err.message,
            property: 'name',
            constraint: [this.messageService.get('merchant.createaddon.fail')],
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

  @Put('addons/:id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateaddon(
    @Body()
    data: MerchantAddonsValidation,
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const result: AddonDocument = await this.addonService.findAddonById(id);

    if (!result) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('merchant.updateaddon.unreg')],
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

    return (await this.addonService.getHttp(url, headersRequest)).pipe(
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

        const cekname: AddonDocument = await this.addonService.findAddonByName(
          data.name,
        );

        if (cekname && cekname.name != result.name) {
          const errors: RMessage = {
            value: data.name,
            property: 'name',
            constraint: [
              this.messageService.get('merchant.createaddon.nameExist'),
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
          const updateresult: Record<string, any> =
            await this.addonService.updateMerchantAddonProfile(data);
          return this.responseService.success(
            true,
            this.messageService.get('merchant.updateaddon.success'),
            updateresult,
          );
        } catch (err) {
          const errors: RMessage = {
            value: err.message,
            property: '',
            constraint: [this.messageService.get('merchant.updateaddon.fail')],
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

  @Delete('addons/:id')
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

    return (await this.addonService.getHttp(url, headersRequest)).pipe(
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
        try {
          const result: DeleteResult =
            await this.addonService.deleteMerchantAddonProfile(id);
          if (result && result.affected == 0) {
            const errors: RMessage = {
              value: id,
              property: 'id',
              constraint: [
                this.messageService.get('merchant.deleteaddon.invalid_id'),
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
            this.messageService.get('merchant.deleteaddon.success'),
          );
        } catch (err) {
          const errors: RMessage = {
            value: id,
            property: 'id',
            constraint: [
              this.messageService.get('merchant.deleteaddon.invalid_id'),
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

  @Get('addons')
  @UserType('admin', 'merchant')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getgroups(@Query() data: string[]): Promise<any> {
    const listgroup: any = await this.addonService.listGroup(data);
    if (!listgroup) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('merchant.listaddon.fail')],
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
      this.messageService.get('merchant.listaddon.success'),
      listgroup,
    );
  }
}
