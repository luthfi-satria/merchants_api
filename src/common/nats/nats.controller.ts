import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';

@Controller('')
export class NatsController {
  logger = new Logger(NatsController.name);
  constructor(
    private readonly menuOnlineService: MenuOnlineService,
    private readonly mStoreOperationalService: StoreOperationalService,
  ) {}

  @EventPattern('catalogs.storeavailability.created')
  async saveMenuOnline(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.created');
    this.menuOnlineService.natsSaveMenuOnline(data);
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

  @EventPattern('orders.order.cancelled_by_store.busy')
  async cancelledByStoreBusy(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.busy');
    await this.mStoreOperationalService
      .updateStoreOpenStatus(data.store_id, false)
      .catch((e) => {
        this.logger.error(e);
        throw e;
      });
  }

  @EventPattern('orders.order.cancelled_by_store.other')
  async cancelledByStoreOther(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.other');
    await this.mStoreOperationalService
      .updateStoreOpenStatus(data.store_id, false)
      .catch((e) => {
        this.logger.error(e);
        throw e;
      });
  }

  @EventPattern('catalogs.menu.updated')
  async updateMenuOnline(@Payload() data: any) {
    this.logger.log('catalogs.menu.updated');
    this.menuOnlineService.natsUpdateMenuOnline(data);
  }

  @EventPattern('catalogs.menu.deleted')
  async deleteMenuOnline(@Payload() data: any) {
    this.logger.log('catalogs.menu.deleted');
    this.menuOnlineService.natsDeleteMenuOnline(data);
  }
}
