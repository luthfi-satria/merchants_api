import {
  Body,
  Controller,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Put,
} from '@nestjs/common';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { SettingsService } from './settings.service';

@Controller('api/v1/merchants/settings')
export class SettingsController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly settingService: SettingsService,
  ) {}

  @Put()
  async updateSetting(@Body() payload: Record<string, any>) {
    try {
      const setting = Object.entries(payload).map((e) => {
        return new SettingDocument({ name: e[0], value: e[1] });
      });

      const result = await this.settingService
        .updateSettings(setting)
        .catch((e) => {
          Logger.error(`ERROR ${e.message}`, '', 'Update Settings');
          throw new InternalServerErrorException(
            this.responseService.error(
              HttpStatus.INTERNAL_SERVER_ERROR,
              {
                constraint: ['Failed to Update Merchant Settings'],
                property: null,
                value: null,
              },
              'Internal Server Exception',
            ),
          );
        });

      return this.responseService.success(
        true,
        'Success update merchant setting',
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update settings');
      throw e;
    }
  }
}
