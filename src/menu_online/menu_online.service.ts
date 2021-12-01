import { MenuOnlineDocument } from '../database/entities/menu_online.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class MenuOnlineService {
  constructor(
    @InjectRepository(MenuOnlineDocument)
    private readonly menuOnlineRepository: Repository<MenuOnlineDocument>,
    private readonly storesService: StoresService,
  ) {}

  async natsSaveMenuOnline(data: any) {
    if (data.menu_price.menu_sales_channel.platform == 'ONLINE') {
      const store = await this.storesService.findMerchantById(data.store_id);
      const menuOnline: Partial<MenuOnlineDocument> = {
        menu_store_id: data.id,
        menu_id: data.menu_price.menu_menu.id,
        name: data.menu_price.menu_menu.name,
        photo: data.menu_price.menu_menu.photo,
        price: data.menu_price.price,
        store: store,
      };

      await this.menuOnlineRepository.save(menuOnline);
    }
  }

  async natsUpdateMenuOnline(data: any) {
    const menus = await this.menuOnlineRepository.find({ menu_id: data.id });
    for (const menu of menus) {
      menu.name = data.name ? data.name : menu.name;
      menu.photo = data.photo ? data.photo : menu.photo;
      this.menuOnlineRepository.save(menu);
    }
  }

  async natsDeleteMenuOnline(data: any) {
    const menus = await this.menuOnlineRepository.find({ menu_id: data.id });
    const ids = [];
    for (const menu of menus) {
      ids.push(menu.id);
    }
    this.menuOnlineRepository.softDelete(ids);
  }
}
