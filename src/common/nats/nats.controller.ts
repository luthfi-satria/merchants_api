import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MenuEfoodService } from 'src/menu_efood/menu_efood.service';

@Controller('')
export class NatsController {
  logger = new Logger(NatsController.name);
  constructor(private readonly menuEfoodService: MenuEfoodService) {}

  @EventPattern('catalogs.storeavailability.created')
  async saveMenuEfood(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.created');
    this.menuEfoodService.natsSaveMenuEfood(data);
  }

  @EventPattern('catalogs.storeavailability.updated')
  async updateMenuEfood(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.updated');
    // this.logger.debug(data);
  }

  @EventPattern('catalogs.storeavailability.deleted')
  async deleteMenuEfood(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.deleted');
    // this.logger.debug(data);
  }
}
