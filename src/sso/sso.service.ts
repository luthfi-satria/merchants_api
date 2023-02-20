import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { genSaltSync, hash } from 'bcrypt';
import { lastValueFrom, map } from 'rxjs';
import { MerchantUsersDocument } from 'src/database/entities/merchant_users.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { Brackets, Like, Repository } from 'typeorm';
import { ssoDto } from './dto/sso.dto';
import { AxiosResponse } from 'axios';
import { SsoAuthDocument } from './dto/sso-auth.dto';
import { RMessage } from 'src/response/response.interface';
import { DateTimeUtils } from 'src/utils/date-time-utils';

@Injectable()
export class SsoService {
  cronConfigs = {
    // enable or disabled process
    sso_process: 0,
    // time range of sync execution
    sso_timespan: 20,
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
    @InjectRepository(SettingDocument)
    private readonly settingRepo: Repository<SettingDocument>,
    @InjectRepository(MerchantUsersDocument)
    private readonly usersRepo: Repository<MerchantUsersDocument>,
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
  ) {}

  logger = new Logger(SsoService.name);

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
          this.cronConfigs.iteration = 1;
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
              // REGISTER OR UPDATE TO SSO
              // fetch result into callback return
              const syncProcess = await this.registerBulk(syncUsersData);

              // UPDATING USERS DATA
              if (syncProcess.data.length > 0) {
                const updateData = [];
                syncProcess.data.forEach((rows) => {
                  updateData.push({
                    id: rows.ext_id,
                    sso_id: rows.sso_id,
                  });
                });

                // UPDATE TO DATABASE
                if (updateData.length > 0) {
                  await this.usersRepo.save(updateData);
                }
              }
              const callback = {
                syncUsers: syncProcess,
              };
              console.log(callback, '<= SSO SYNC PROCESS');
              return callback;
            }
          }
        }
      }
      this.cronConfigs.iteration++;
    } catch (error) {
      console.log(error);
      this.cronConfigs.iteration++;
      throw error;
    }
  }

  /**
   * ##################################################################################
   * MERCHANTS SERVICE SETTINGS
   * ##################################################################################
   */
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

  /**
   * ##################################################################################
   * DATABASE HANDLER -> GET UPDATED USERS USERS
   * ##################################################################################
   * @returns
   */
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
        for (const rows in queryResult) {
          const rowsData = queryResult[rows];
          const company = rowsData.group;
          const ssoPayload: Partial<ssoDto> = {
            ext_id: rowsData.id,
            sso_id: rowsData.sso_id,
            email: rowsData.email ? rowsData.email : '',
            fullname: rowsData.name,
            phone_number: rowsData.phone,
            recovery_phone: rowsData.phone,
            type: rowsData.email ? 'email' : rowsData.phone ? 'phone' : 'email',
            gender: 'Pria',
            business: [
              {
                name: company.name,
                email: company.director_email
                  ? company.director_email
                  : rowsData.email,
                bio: '',
                slogan: '',
                etags: 'eF' + company.director_phone,
                profile_picture: '',
                url: '',
                owner: 0,
                location: company.address,
                phone: company.director_phone,
                level: 0,
                parent_id: 0,
                type: 'efood',
                approval: 1,
                open_day: [],
                open_hour: '',
                close_hour: '',
                is_open: 1,
                status: 1,
                id_role: 1,
                label: company.name,
                nameAddress: 'corporate address',
                phoneAddress: company.phone,
                description: '',
                full_address: company.address,
                postal_code: '',
                longitude: '',
                latitude: '',
                id_country: null,
                id_provinsi: null,
                id_kabupaten: null,
                id_kecamatan: null,
                id_kelurahan: null,
              },
            ],
          };

          if (!ssoPayload.sso_id) {
            const password = rowsData.phone
              ? '0' + rowsData.phone.substring(2)
              : '123456';

            ssoPayload.password = password;
          }
          requestData.push(ssoPayload);
        }
      }
      this.cronConfigs.offset += this.cronConfigs.sso_data_limit;
      return requestData;
    }
    this.cronConfigs.offset = 0;
    return {};
  }

  /**
   * QUERY STATEMENT FOR GETTING USERS DATA
   * @returns
   */
  queryStatement() {
    const queryData = this.usersRepo
      .createQueryBuilder('mu')
      .leftJoinAndSelect('mu.group', 'group')
      .where('mu.group_id IS NOT NULL')
      .andWhere('mu.status = :status', { status: 'ACTIVE' })
      .andWhere('mu.role_id = :role_id', {
        role_id: 'bc82cac9-b138-4cdc-a18d-0b3dfe8c559f',
      });
    // IF SSO LAST UPDATE IS NOT EMPTY
    if (this.cronConfigs.sso_lastupdate) {
      queryData.andWhere(
        new Brackets((qb) => {
          qb.where('mu.updated_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
          qb.orWhere('mu.created_at > :lastUpdate', {
            lastUpdate: this.cronConfigs.sso_lastupdate,
          });
        }),
      );
      queryData.orWhere('mu.sso_id is null');
    }
    return queryData;
  }

  /**
   * UPDATE USERS SETTINGS
   * @returns
   */
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

  /**
   * ##################################################################################
   * SSO PROCESS
   * @param UsersData
   * @returns
   * ##################################################################################
   */
  async registerBulk(UsersData) {
    // sso authentication process
    const loginSSO = await this.ssoAuthentication();
    if (loginSSO && loginSSO.data.token) {
      // set sso-token from authentication process into registration header process
      const headerRequest = {
        'Content-Type': 'application/json',
        'sso-token': loginSSO.data.token.token_code,
      };

      // bulk registration process
      const syncUsers = await this.httpSsoRequests(
        UsersData,
        'api/user/register_personal_business_bulk',
        headerRequest,
      );

      const updateData = [];
      if (syncUsers && syncUsers.data.length > 0) {
        console.log(syncUsers);
        syncUsers.data.forEach((rows) => {
          if (rows.sso_id != 0) {
            const bulkUpdate: Partial<MerchantUsersDocument> = {
              id: rows.ext_id,
              sso_id: rows.sso_id,
            };
            updateData.push(bulkUpdate);
          }
        });
      }

      let updateStatus = [];
      if (updateData.length > 0) {
        updateStatus = await this.usersRepo.save(updateData);
      }

      console.log(
        {
          syncStatus: syncUsers,
          updateStatus: updateStatus,
        },
        '<= SYNC USER SSO',
      );
      return syncUsers;
    }

    // IF THERE IS NO token IN SSO RESPONSE THEN RETURNING UNAUTHORIZED ERROR
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

  /**
   * SSO AUTHENTICATION PROCESS
   * @returns
   */
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

  /**
   * GENERAL HTTP SSO REQUEST
   * @param payload
   * @param urlPath
   * @param headerRequest
   * @returns
   */
  async httpSsoRequests(payload: any, urlPath: string, headerRequest) {
    try {
      // SSO URL
      const url = `${process.env.SSO_HOST}/${urlPath}`;

      // SSO POST REQUEST
      const post_request = this.httpService
        .post(url, payload, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );

      // GETTING RESPONSE FROM SSO
      const response = await lastValueFrom(post_request);
      return response;
    } catch (error) {
      console.log(error.response.data);
      return error.response.data;
    }
  }

  /**
   * ##################################################################################
   * THIS FUNCTION ONLY FOR TESTING
   * ##################################################################################   *
   * @returns
   */
  async testingSSO() {
    try {
      const updatedUSERS = await this.getUpdatedUsers();
      const synchronize = await this.registerBulk(updatedUSERS);

      return this.responseService.success(
        true,
        this.messageService.get('general.general.success'),
        synchronize,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * ##################################################################################
   * GENERATE DEFAULT PASSWORD
   * ##################################################################################
   * @param password
   * @returns
   */
  generateHashPassword(password: string): Promise<string> {
    const defaultSalt: number =
      Number(process.env.HASH_PASSWORDSALTLENGTH) || 10;
    const salt = genSaltSync(defaultSalt);

    return hash(password, salt);
  }
}
