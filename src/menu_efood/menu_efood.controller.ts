import { MenuEfoodService } from './menu_efood.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Controller, Logger } from '@nestjs/common';

@Controller('/api/v1/merchants/banners')
export class MenuEfoodController {
  constructor(private readonly menuEfoodService: MenuEfoodService) {}

  logger = new Logger();

  @EventPattern('catalogs.storeavailability.created')
  async sendEmailFromEvent(@Payload() menu: any): Promise<void> {
    this.logger.log('received otp.email.created event');
    this.logger.debug(menu);
    this.menuEfoodService.updateMenuEfood(menu.menu);
  }
}
