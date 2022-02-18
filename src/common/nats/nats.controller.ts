import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InternalService } from 'src/internal/internal.service';
import { MenuOnlineService } from 'src/menu_online/menu_online.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { StoreOperationalService } from 'src/stores/stores-operational.service';
import { StoresService } from 'src/stores/stores.service';

@Controller('')
export class CommonNatsController {
  logger = new Logger(CommonNatsController.name);
  constructor(
    private readonly menuOnlineService: MenuOnlineService,
    private readonly mStoreOperationalService: StoreOperationalService,
    private readonly internalService: InternalService,
    private readonly merchantService: MerchantsService,
    private readonly storesService: StoresService,
  ) {}

  @EventPattern('loyalties.promo_brand.active')
  async promoActived(@Payload() data: any) {
    this.logger.log('loyalties.promo_brand.active');
    this.merchantService.updatedRecommendationPromo(data);
  }

  @EventPattern('loyalties.promo_brand.inactive')
  async promoInactived(@Payload() data: any) {
    this.logger.log('loyalties.promo_brand.inactive');
    this.merchantService.updatedRecommendationPromo(data);
  }

  @EventPattern('catalogs.storeavailability.created')
  async saveMenuOnline(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.created');
    this.menuOnlineService.natsCreateStoreAvailability(data);
  }

  @EventPattern('catalogs.storeavailability.updated')
  async updateMenuEfood(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.updated');
    this.menuOnlineService.natsUpdateStoreAvailabilityy(data);
  }

  @EventPattern('catalogs.storeavailability.deleted')
  async deleteMenuEfood(@Payload() data: any) {
    this.logger.log('catalogs.storeavailability.deleted');
    this.menuOnlineService.natsdeleteStoreAvailability(data);
  }

  @EventPattern('orders.order.cancelled_by_store.busy')
  async cancelledByStoreBusy(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.busy');
    await this.mStoreOperationalService
      .updateIsStoreOpenStatus(data.store_id, false)
      .catch((e) => {
        this.logger.error(e);
        throw e;
      });
  }

  @EventPattern('orders.order.cancelled_by_store.operational')
  async cancelledByStoreOther(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.operational');
    await this.mStoreOperationalService
      .updateIsStoreOpenStatus(data.store_id, false)
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

  @EventPattern('catalogs.menuprice.updated')
  async updateMenuPrice(@Payload() data: any) {
    this.logger.log('catalogs.menuprice.updated');
    this.menuOnlineService.natsUpdateMenuPrice(data);
  }

  @EventPattern('catalogs.menuprice.deleted')
  async deleteMenuPrice(@Payload() data: any) {
    this.logger.log('catalogs.menuprice.deleted');
    this.menuOnlineService.natsDeleteMenuPrice(data);
  }

  @EventPattern('catalogs.menu.online.averageprice.updated')
  async averagePriceUpdated(@Payload() data: any) {
    this.logger.log('catalogs.menu.online.averageprice.updated');
    this.internalService.updateStoreAveragePrice(data);
  }

  @EventPattern('catalogs.discount.started')
  async orderCancelledByCustomer(@Payload() data: any) {
    this.logger.log('catalogs.discount.started');
    this.storesService.updateNumDiscounts(data, 'started');
  }

  @EventPattern('catalogs.discount.stopped')
  async orderCancelledByStoreStocks(@Payload() data: any) {
    this.logger.log('catalogs.discount.stopped');
    this.storesService.updateNumDiscounts(data, 'stopped');
  }

  @EventPattern('catalogs.discount.cancelled')
  async orderCancelledByStoreOperational(@Payload() data: any) {
    this.logger.log('catalogs.discount.cancelled');
    this.storesService.updateNumDiscounts(data, 'cancelled');
  }

  @EventPattern('catalogs.discount.finished')
  async orderCancelledByStoreBusy(@Payload() data: any) {
    this.logger.log('catalogs.discount.finished');
    this.storesService.updateNumDiscounts(data, 'finished');
  }
}
