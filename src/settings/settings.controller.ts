import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Put,
} from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
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

  @Get('budget-meal')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getBudgetMeal(): Promise<RSuccessMessage> {
    try {
      const setting = await this.settingService.findByName('budget_meal_max');
      const result = {
        budget_meal_max: Number(setting.value),
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Get settings');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'budget_meal_max',
            constraint: [this.messageService.get('merchant.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Put('budget-meal')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateBudgetMeal(
    @Body() data: Record<string, any>,
  ): Promise<RSuccessMessage> {
    try {
      const setting = await this.settingService.updateSettingByName(
        'budget_meal_max',
        data,
      );
      const result = {
        budget_meal_max: Number(setting.value),
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update settings');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'budget_meal_max',
            constraint: [this.messageService.get('merchant.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Get('store-radius')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getStoreRadius(): Promise<RSuccessMessage> {
    try {
      const setting = await this.settingService.findByName('store_radius');
      const result = {
        store_radius: Number(setting.value),
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Get settings');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'store_radius',
            constraint: [this.messageService.get('merchant.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Put('store-radius')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateStoreRadius(
    @Body() data: Record<string, any>,
  ): Promise<RSuccessMessage> {
    try {
      const setting = await this.settingService.updateSettingByName(
        'store_radius',
        data,
      );
      const result = {
        store_radius: Number(setting.value),
      };

      return this.responseService.success(
        true,
        this.messageService.get('merchant.general.success'),
        result,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update settings');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: 'store_radius',
            constraint: [this.messageService.get('merchant.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }
}
