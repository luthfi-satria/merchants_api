import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { Like, Repository } from 'typeorm';
import { DateTimeUtils } from 'src/utils/date-time-utils';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import { ssoDto } from './dto/sso.dto';
import { SsoAuthDocument } from './dto/sso-auth.dto';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
@Injectable()
export class SsoService {
  cronConfigs = {
    // enable or disabled process
    sso_process: 0,
    // time range of sync execution
    sso_timespan: 1,
    // last update of sync process
    sso_lastupdate: null,
    // limit data execution
    sso_data_limit: 10,
    sso_refresh_config: 60,
    // skip of data index
    offset: 0,
    // total sync data found
    total_data: 0,
    // iteration counter
    iteration: 1,
  };

  constructor(
    @InjectRepository(MerchantUsersDocument)
    private readonly usersRepo: Repository<MerchantUsersDocument>,
    @InjectRepository(SettingDocument)
    private readonly settingRepo: Repository<SettingDocument>,
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
  ) {}

  logger = new Logger(SsoService.name);

  async getMerchantsConfig() {
    const settings = await this.settingRepo.find({
      where: {
        name: Like('sso_%'),
      },
    });
    settings.forEach((element) => {
      if (element.name == 'sso_lastupdate') {
        this.cronConfigs[element.name] = element.value;
      } else {
        this.cronConfigs[element.name] = parseInt(element.value);
      }
    });
  }

  @Cron('* * * * * *')
  async syncUsers() {
    try {
      // Iterate base on timespan
      if (this.cronConfigs.iteration % this.cronConfigs.sso_timespan == 0) {
        if (
          // if iteration time same with refresh time then update cron settings
          this.cronConfigs.iteration % this.cronConfigs.sso_refresh_config ==
          0
        ) {
          this.logger.log('SSO -> SSO CONFIGS');
          // reinitialize cron setting
          await this.getMerchantsConfig();
          // if cron process is enable
          if (this.cronConfigs.sso_process) {
            this.logger.log('SSO -> SYNCHRONIZING');
            // get updated users data
            const syncUsersData = await this.getUpdatedUsers();
            // if none data can be sync, then update configuration
            if (
              this.cronConfigs.total_data > 0 &&
              this.cronConfigs.offset >= this.cronConfigs.total_data
            ) {
              this.logger.log('SSO -> UPDATE CONFIGS');
              await this.updateSettings();
            } else {
              // fetch result into callback return
              const callback = {
                syncUsers: await this.registerBulk(syncUsersData),
              };
              console.log(callback, '<= SSO SYNC PROCESS');
              return callback;
            }
          }
        }
        this.cronConfigs.iteration++;
      }
    } catch (error) {
      console.log(error);
      this.cronConfigs.iteration++;
      throw error;
    }
  }

  async getUpdatedUsers() {
    if (this.cronConfigs.offset == 0) {
      const queryCount = this.queryStatement();
      this.cronConfigs.total_data = await queryCount.getCount();
    }

    if (this.cronConfigs.total_data > 0) {
      console.log(
        {
          configs: this.cronConfigs,
          cond: this.cronConfigs.offset < this.cronConfigs.total_data,
        },
        '<= SSO - CONFIG PROCESS',
      );
    }

    if (this.cronConfigs.offset < this.cronConfigs.total_data) {
      const queryData = this.queryStatement();
      const queryResult = await queryData
        .skip(this.cronConfigs.offset)
        .take(this.cronConfigs.sso_data_limit)
        .getMany();

      const requestData = [];
      if (queryResult) {
        queryResult.forEach((rows) => {
          const ssoPayload: Partial<ssoDto> = {
            efood_id: rows.id,
            sso_id: rows.sso_id,
            email: rows.email,
            fullname: rows.name,
            phone_number: rows.phone,
            recovery_phone: rows.phone,
          };
          requestData.push(ssoPayload);
        });
      }
      this.cronConfigs.offset += this.cronConfigs.sso_data_limit;
      return requestData;
    }
    this.cronConfigs.offset = 0;
    return {};
  }

  async ssoAuthentication() {
    const headerRequest = {
      'Content-Type': 'application/json',
    };
    const authData: SsoAuthDocument = {
      name: process.env.SSO_NAME,
      secret_key: process.env.SSO_SECRET_KEY,
      device_id: process.env.SSO_DEVICE_ID,
      device_type: process.env.SSO_DEVICE_TYPE,
    };
    const authenticate = await this.httpSsoRequests(
      authData,
      `api/token/get`,
      headerRequest,
    );
    return authenticate;
  }

  async registerBulk(UsersData) {
    // authentication
    const loginSSO = await this.ssoAuthentication();
    if (loginSSO && loginSSO.data.length > 0) {
      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const syncUsers = await this.httpSsoRequests(
        UsersData,
        'api/user/register_personal_business_bulk',
        headerRequest,
      );
      return syncUsers;
    }
    const errors: RMessage = {
      value: '',
      property: 'SSO Service',
      constraint: [loginSSO],
    };
    return this.responseService.error(
      HttpStatus.UNAUTHORIZED,
      errors,
      'UNAUTHORIZED',
    );
  }

  async httpSsoRequests(payload: any, urlPath: string, headerRequest) {
    try {
      const url = `${process.env.SSO_HOST}/${urlPath}`;
      const post_request = this.httpService
        .post(url, payload, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );
      const response = await lastValueFrom(post_request);
      return response;
    } catch (error) {
      console.log(error.response.data);
      return error.response.data;
    }
  }

  queryStatement() {
    const query = this.usersRepo.createQueryBuilder();
    if (this.cronConfigs.sso_lastupdate) {
      query
        .where('created_at > :lastUpdated', {
          lastUpdated: this.cronConfigs.sso_lastupdate,
        })
        .orWhere('updated_at > :lastUpdated', {
          lastUpdated: this.cronConfigs.sso_lastupdate,
        })
        .orWhere('deleted_at > :lastUpdated', {
          lastUpdated: this.cronConfigs.sso_lastupdate,
        });
    }
    return query;
  }

  async updateSettings() {
    const updateSettings = await this.settingRepo
      .createQueryBuilder()
      .update()
      .set({
        value: DateTimeUtils.convertTimeToUTC(
          String(new Date()),
          Number('+0700'),
        ),
      })
      .where({ name: 'sso_lastupdate' })
      .execute();
    return updateSettings;
  }
}
