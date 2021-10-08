import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CommonService } from 'src/common/common.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { RoleResponseDTO } from './dto/role-response.dto';
import { RoleDTO } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly httpService: HttpService,
    @Message() private readonly messageService: MessageService,
    @Response() private readonly responseService: ResponseService,
    private readonly commonService: CommonService,
  ) {}

  logger = new Logger();

  async getRole(role_ids: string[]): Promise<RoleDTO[]> {
    if (!role_ids) {
      return null;
    }
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    try {
      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/roles/batchs`;
      const post_request = this.httpService
        .post(url, role_ids, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
          catchError((err) => {
            this.logger.error(err);
            throw err;
          }),
        );
      const response_role: RoleResponseDTO = await lastValueFrom(post_request);
      if (!response_role) {
        const error_message: RMessage = {
          value: role_ids.join(),
          property: 'role_ids',
          constraint: [this.messageService.get('common.role.not_found')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            error_message,
            'Bad Request',
          ),
        );
      }
      return response_role.data;
    } catch (error) {
      throw new BadRequestException(error.response.data);
    }
  }

  async getAndValodateRoleByRoleId(role_id: string): Promise<RoleDTO> {
    try {
      const roles = await this.getRole([role_id]);
      if (!roles) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: role_id,
              property: 'role_id',
              constraint: [this.messageService.get('common.role.not_found')],
            },
            'Bad Request',
          ),
        );
      }
      return roles[0];
    } catch (error) {
      throw new BadRequestException(error.response.data);
    }
  }

  async getRoleByPlatforms(platforms: string[]): Promise<RoleDTO[]> {
    if (!platforms) {
      return null;
    }
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    try {
      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/roles/batchs-by-platforms`;
      const post_request = this.httpService
        .post(url, platforms, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
          catchError((err) => {
            this.logger.error(err);
            throw err;
          }),
        );
      const response_role: RoleResponseDTO = await lastValueFrom(post_request);
      if (!response_role) {
        const error_message: RMessage = {
          value: platforms.join(),
          property: 'profiles',
          constraint: [this.messageService.get('common.role.not_found')],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            error_message,
            'Bad Request',
          ),
        );
      }
      return response_role.data;
    } catch (error) {
      throw new BadRequestException(error.response.data);
    }
  }
}
