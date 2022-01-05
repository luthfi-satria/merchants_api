import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StoresService } from 'src/stores/stores.service';

@Controller('nats')
export class NatsController {
  logger = new Logger(NatsController.name);

  constructor(private readonly storesService: StoresService) {}

  @EventPattern('catalogs.discount.started')
  async orderCancelledByCustomer(@Payload() data: any) {
    this.logger.log('catalogs.discount.started');
    this.storesService.updateNumDiscounts(data);
  }

  @EventPattern('catalogs.discount.stopped')
  async orderCancelledByStoreStocks(@Payload() data: any) {
    this.logger.log('catalogs.discount.stopped');
    this.storesService.updateNumDiscounts(data);
  }

  @EventPattern('catalogs.discount.cancelled')
  async orderCancelledByStoreOperational(@Payload() data: any) {
    this.logger.log('catalogs.discount.cancelled');
    this.storesService.updateNumDiscounts(data);
  }

  @EventPattern('catalogs.discount.finished')
  async orderCancelledByStoreBusy(@Payload() data: any) {
    this.logger.log('catalogs.discount.finished');
    this.storesService.updateNumDiscounts(data);
  }
}
