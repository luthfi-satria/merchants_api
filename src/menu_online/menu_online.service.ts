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
    const store = await this.storesService.findMerchantById(data.store_id);
    const menuOnline: Partial<MenuOnlineDocument> = {
      menu_id: data.menu_price.menu.id,
      name: data.menu_price.menu.name,
      photo: data.menu_price.menu.photo,
      price: data.menu_price.price,
      store: store,
    };

    await this.menuOnlineRepository.save(menuOnline);
  }
}
