import { CityDTO } from 'src/common/services/admins/dto/city.dto';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../helper/column_numberic_transformer';
import { AddonDocument } from './addons.entity';
import { MenuOnlineDocument } from './menu_online.entity';
import { MerchantDocument } from './merchant.entity';
import { MerchantUsersDocument } from './merchant_users.entity';
import { SearchHistoryStoreDocument } from './search_history_store.entity';
import { StoreCategoriesDocument } from './store-categories.entity';
import { StoreOperationalHoursDocument } from './store_operational_hours.entity';

export enum enumDeliveryType {
  delivery_only = 'DELIVERY_ONLY',
  delivery_and_pickup = 'DELIVERY_AND_PICKUP',
  pickup_only = 'PICKUP_ONLY',
}

export enum enumStoreStatus {
  draf = 'DRAFT',
  waiting_for_approval = 'WAITING_FOR_APPROVAL',
  waiting_for_brand_approval = 'WAITING_FOR_BRAND_APPROVAL',
  active = 'ACTIVE',
  inactive = 'INACTIVE',
  banned = 'BANNED',
  rejected = 'REJECTED',
}

@Entity({ name: 'merchants_stores' })
@Index(['location_latitude', 'location_longitude', 'status', 'deleted_at'])
@Index(['location_latitude', 'location_longitude'])
@Index(['id', 'deleted_at'])
export class StoreDocument {
  //General Info
  @Index()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MerchantDocument, (merchant) => merchant.id)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantDocument;

  @Index()
  @Column('uuid')
  merchant_id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column('uuid', { nullable: true })
  city_id: string;
  city: CityDTO;

  @Column()
  address: string;

  @Index()
  @Column('decimal', {
    // default: '106.827153', //monas
    transformer: new ColumnNumericTransformer(),
  })
  location_longitude: number;

  @Index()
  @Column('decimal', {
    // default: '-6.175392', //monas
    transformer: new ColumnNumericTransformer(),
  })
  location_latitude: number;

  @Column({
    type: 'int',
    nullable: true,
    default: null,
  })
  gmt_offset: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_store_open: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_open_24h: boolean;

  @Column({ default: 0 })
  average_price: number;

  @Column({ default: false })
  platform: boolean;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Photo+Image',
  })
  photo: string;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Photo+Image',
  })
  banner: string;

  @ManyToMany(() => StoreCategoriesDocument)
  @JoinTable({ name: 'merchants_stores_store_categories' })
  store_categories: StoreCategoriesDocument[];

  @Column({
    type: 'enum',
    enum: enumDeliveryType,
    default: enumDeliveryType.delivery_only,
  })
  delivery_type: enumDeliveryType;

  @ManyToMany(() => AddonDocument)
  @JoinTable({ name: 'merchants_stores_addons' })
  service_addons: AddonDocument[];

  //Data Bank
  // @ManyToOne(() => ListBankDocument, (bank) => bank.id)
  // @JoinColumn({ name: 'bank_id' })
  // bank: ListBankDocument;

  @Column('uuid', { nullable: true })
  bank_id: string;

  @Column({ nullable: true })
  bank_account_no: string;

  @Column('decimal', { nullable: true })
  rating: number;

  @Column({ nullable: true })
  numrating: number;

  @Column({ default: 0 })
  numorders: number;

  @Column({ nullable: true })
  bank_account_name: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  auto_accept_order: boolean;

  //Metadata
  @Index()
  @Column({
    type: 'enum',
    enum: enumStoreStatus,
    default: enumStoreStatus.waiting_for_approval,
  })
  status: enumStoreStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @Index()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  rejected_at: Date;

  @OneToMany(
    () => StoreOperationalHoursDocument,
    (operational_hours) => operational_hours.store,
    {
      cascade: ['insert', 'update', 'remove', 'soft-remove'],
      onDelete: 'CASCADE',
    },
  )
  operational_hours: StoreOperationalHoursDocument[];

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ default: 0 })
  numdiscounts: number;

  @OneToMany(
    () => SearchHistoryStoreDocument,
    (search_history_store) => search_history_store.store,
  )
  search_history_stores: SearchHistoryStoreDocument[];

  @ManyToMany(() => MerchantUsersDocument, (users) => users.stores)
  users: MerchantUsersDocument[];

  @OneToMany(() => MenuOnlineDocument, (menu) => menu.store)
  menus: MenuOnlineDocument[];

  store_operational_status: boolean;
}
