import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingDocument } from 'src/database/entities/setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingDocument)
    private readonly settingRepository: Repository<SettingDocument>,
  ) {}

  async findByName(name: string): Promise<SettingDocument> {
    return this.settingRepository.findOne({ name: name });
  }

  async getSettings(): Promise<SettingDocument[]> {
    return this.settingRepository.find();
  }

  async updateSettings(data: SettingDocument[]): Promise<SettingDocument[]> {
    try {
      return await this.settingRepository.save(data);
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Update Settings');
      throw e;
    }
  }

  async updateSettingByName(id: string, data: any): Promise<SettingDocument> {
    const setting = await this.settingRepository.findOne({
      where: { name: id },
    });
    setting.value = data[id];
    return this.settingRepository.save(setting);
  }
}
