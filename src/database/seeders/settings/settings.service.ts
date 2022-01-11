import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { Repository } from 'typeorm';
import { settings } from './settings.data';

@Injectable()
export class SettingsSeederService {
  constructor(
    @InjectRepository(SettingDocument)
    private readonly settingsRepository: Repository<SettingDocument>,
  ) {}

  async create(): Promise<Array<Promise<SettingDocument>>> {
    const countData = await this.settingsRepository.count();
    if (countData) {
      Logger.log('Data seeder had been inserted');
      return null;
    }
    try {
      await this.settingsRepository.save(settings);
    } catch (error) {
      Logger.error(error);
    }
  }
}
