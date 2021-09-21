import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { Repository } from 'typeorm';
import { UpdateBannerByMerchantIdDto, UpdateBannerByStoreIdDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
    constructor(
        @InjectRepository(StoreDocument)
        private readonly storeRepository: Repository<StoreDocument>,
    ) { }

    async getByMerchantId(id: string): Promise<StoreDocument[]> {
        return this.storeRepository.find({ merchant_id: id })
    }

    async getByStoreId(id: string): Promise<StoreDocument> {
        return this.storeRepository.findOne(id)
    }

    async updateBannerByMerchantId(data: UpdateBannerByMerchantIdDto): Promise<StoreDocument[]> {
        const storeByMerchant = await this.getByMerchantId(data.merchant_id)
        storeByMerchant.forEach((item) => {
            item.banner = data.banner
            this.storeRepository.save(item)
        })
        return await this.getByMerchantId(data.merchant_id)
    }

    async updateBannerByStoreId(data: UpdateBannerByStoreIdDto): Promise<StoreDocument> {
        const store = await this.getByStoreId(data.store_id)
        store.banner = data.banner
        return this.storeRepository.save(store)
    }
}
