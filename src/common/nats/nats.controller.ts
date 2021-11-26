import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MenuEfoodService } from 'src/menu_efood/menu_efood.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';

@Controller('')
export class NatsController {
  logger = new Logger(NatsController.name);
  constructor(
    private readonly menuEfoodService: MenuEfoodService,
    private readonly mStoreOperationalService: StoreOperationalService,
  ) {}

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

}
