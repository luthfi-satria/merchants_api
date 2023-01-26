import { Controller, Get } from '@nestjs/common';
import { ElasticsService } from './elastics.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { Post } from '@nestjs/common/decorators';

@Controller('api/v1/merchants/elastic')
export class ElasticsController {
  constructor(private readonly elasticsService: ElasticsService) {}

  @Get('')
  @ResponseStatusCode()
  async syncAll() {
    return this.elasticsService.syncAll();
  }

  @Get('getAddons')
  @ResponseStatusCode()
  async getAddons() {
    return this.elasticsService.getAddons();
  }

  @Get('getGroups')
  @ResponseStatusCode()
  async getGroups() {
    return this.elasticsService.getGroups();
  }

  @Get('getLobs')
  @ResponseStatusCode()
  async getLobs() {
    return this.elasticsService.getLobs();
  }

  @Get('getMenuOnlines')
  @ResponseStatusCode()
  async getMenuOnlines() {
    return this.elasticsService.getMenuOnlines();
  }

  @Get('getMerchants')
  @ResponseStatusCode()
  async getMerchants() {
    return this.elasticsService.getMerchants();
  }

  @Get('getPriceRangeLanguages')
  @ResponseStatusCode()
  async getPriceRangeLanguages() {
    return this.elasticsService.getPriceRangeLanguages();
  }

  @Get('getPriceRanges')
  @ResponseStatusCode()
  async getPriceRanges() {
    return this.elasticsService.getPriceRanges();
  }

  @Get('getStoreCategories')
  @ResponseStatusCode()
  async getStoreCategories() {
    return this.elasticsService.getStoreCategories();
  }

  @Get('getStoreCategoryLanguages')
  @ResponseStatusCode()
  async getStoreCategoryLanguages() {
    return this.elasticsService.getStoreCategoryLanguages();
  }

  @Get('getStoreOperationalHours')
  @ResponseStatusCode()
  async getStoreOperationalHours() {
    return this.elasticsService.getStoreOperationalHours();
  }

  @Get('getStoreOperationalShift')
  @ResponseStatusCode()
  async getStoreOperationalShift() {
    return this.elasticsService.getStoreOperationalShift();
  }

  @Get('getStores')
  @ResponseStatusCode()
  async getStores() {
    return this.elasticsService.getStores();
  }

  @Get('getUsers')
  @ResponseStatusCode()
  async getUsers() {
    return this.elasticsService.getUsers();
  }

  @Post('updateSettings')
  @ResponseStatusCode()
  async updateSettings() {
    return this.elasticsService.updateSettings();
  }
}
