import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CommonService } from 'src/common/common.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { RoleResponseDTO } from './dto/role-response.dto';
import { RoleDTO } from './dto/role.dto';
import { SpecialRoleDTO } from './dto/special-role.dto';
import {
  SpecialRoleResponseDTO,
  SpecialRolesResponseDTO,
} from './dto/special-role-response.dto';

export enum SpecialRoleCodes {
  brand_manager = 'brand_manager',
  corporate_director = 'corporate_director',
  corporate_director_finance_operational = 'corporate_director_finance_operational',
  corporate_finance = 'corporate_finance',
  corporate_finance_operational = 'corporate_finance_operational',
  corporate_operational = 'corporate_operational',
  store_cashier = 'store_cashier',
  store_manager = 'store_manager',
}

export enum SpecialRolesPlatforms {
  NONE = 'NONE',
  ZEUS = 'ZEUS',
  HERMES_CORPORATE = 'HERMES_CORPORATE',
  HERMES_BRAND = 'HERMES_BRAND',
  HERMES_STORE = 'HERMES_STORE',
}

@Injectable()
export class RoleService {
  constructor(
    private readonly httpService: HttpService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
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

  async getRoleAndValidatePlatformByRoleId(
    role_id: string,
    platform: string,
  ): Promise<RoleDTO> {
    try {
      const roles = await this.getRole([role_id]);
      if (!roles || roles.length == 0) {
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
      if (roles[0].platform != platform) {
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            {
              value: role_id,
              property: 'role_id',
              constraint: [
                this.messageService.get('common.role.rolePlatformNotMatch'),
              ],
            },
            'Bad Request',
          ),
        );
      }
      return roles[0];
    } catch (error) {
      this.logger.log(error, 'Catch Error');
      throw error;
    }
  }

  async getSpecialRoleByCodes(
    codes: SpecialRoleCodes[],
  ): Promise<SpecialRoleDTO[]> {
    if (!codes) {
      return null;
    }
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    try {
      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/internal/special-roles/get-by-codes`;
      const post_request = this.httpService
        .post(url, codes, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
          catchError((err) => {
            this.logger.error(err);
            throw err;
          }),
        );
      const response_role: SpecialRolesResponseDTO = await lastValueFrom(
        post_request,
      );
      if (!response_role) {
        const error_message: RMessage = {
          value: codes.join(),
          property: 'codes',
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

  async getSpecialRoleByCode(code: SpecialRoleCodes): Promise<SpecialRoleDTO> {
    if (!code) {
      return null;
    }
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    try {
      const url = `${process.env.BASEURL_AUTH_SERVICE}/api/v1/auth/internal/special-roles/get-by-code/${code}`;
      const post_request = this.httpService
        .post(url, null, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
          catchError((err) => {
            this.logger.error(err);
            throw err;
          }),
        );
      const response_special_role: SpecialRoleResponseDTO = await lastValueFrom(
        post_request,
      );
      if (!response_special_role) {
        const error_message: RMessage = {
          value: code,
          property: 'code',
          constraint: [
            this.messageService.get('merchant.general.dataNotFound'),
          ],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            error_message,
            'Bad Request',
          ),
        );
      }
      return response_special_role.data;
    } catch (error) {
      throw new BadRequestException(error.response.data);
    }
  }
}
