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
import { LobService } from './lob.service';
import { MerchantLobValidation } from './validation/lob.validation';
import { RequestValidationPipe } from 'src/utils/request-validation.pipe';
import { LobDocument } from 'src/database/entities/lob.entity';

@Controller('api/v1/merchants')
export class LobController {
  constructor(
    private readonly lobService: LobService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post('lob')
  @ResponseStatusCode()
  async createlob(
    @Body(RequestValidationPipe(MerchantLobValidation))
    data: MerchantLobValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    data.name = data.name.toLowerCase();

    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createlob.invalid_token'),
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

    return (await this.lobService.getHttp(url, headersRequest)).pipe(
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
              this.messageService.get('merchant.createlob.invalid_token'),
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

        const result: LobDocument = await this.lobService.findMerchantByName(
          data.name,
        );

        if (result) {
          const errors: RMessage = {
            value: data.name,
            property: 'name',
            constraint: [
              this.messageService.get('merchant.createlob.nameExist'),
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
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Put('lob/:id')
  @ResponseStatusCode()
  async updatelob(
    @Body(RequestValidationPipe(MerchantLobValidation))
    data: MerchantLobValidation,
    @Param('id') id: string,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    data.name = data.name.toLowerCase();
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createlob.invalid_token'),
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
    const result: LobDocument = await this.lobService.findMerchantById(id);

    if (!result) {
      const errors: RMessage = {
        value: id,
        property: 'lob_id',
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

    data.lob_id = result.lob_id;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/validate-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };

    return (await this.lobService.getHttp(url, headersRequest)).pipe(
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
              this.messageService.get('merchant.createlob.invalid_token'),
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

        const cekname: LobDocument = await this.lobService.findMerchantByName(
          data.name,
        );

        if (cekname && cekname.name != result.name) {
          const errors: RMessage = {
            value: data.name,
            property: 'name',
            constraint: [
              this.messageService.get('merchant.createlob.nameExist'),
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
            await this.lobService.updateMerchantLobProfile(data);
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
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Delete('lob/:id')
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
          this.messageService.get('merchant.createlob.invalid_token'),
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

    return (await this.lobService.getHttp(url, headersRequest)).pipe(
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
              this.messageService.get('merchant.createlob.invalid_token'),
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
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Get('lob')
  @ResponseStatusCode()
  async getgroups(@Query() data: string[]): Promise<any> {
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
  }
}
