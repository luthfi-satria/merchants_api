import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';
import { MerchantUsersDocument } from './merchant_users.entity';
import { StoreDocument } from './store.entity';

export enum MerchantStatus {
  Draft = 'DRAFT',
  Waiting_for_approval = 'WAITING_FOR_APPROVAL',
  Waiting_for_corporate_approval = 'WAITING_FOR_CORPORATE_APPROVAL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Banned = 'BANNED',
  Rejected = 'REJECTED',
}

export enum MerchantType {
  Partner = 'PARTNER',
  Regular = 'REGULAR',
}

export enum PromoType {
  SHOPPING_COST = 'SHOPPING_COST',
  DELIVERY_COST = 'DELIVERY_COST',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  PRICE = 'PRICE',
}

@Entity({ name: 'merchants_merchants' })
@Index(['id', 'status', 'deleted_at'])
@Index(['group_id', 'status', 'deleted_at'])
@Index(['group_id', 'id', 'deleted_at'])
@Index(['id', 'deleted_at'])
export class MerchantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  group_id: string;

  @Column({
    type: 'enum',
    enum: MerchantType,
    default: MerchantType.Partner,
  })
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  profile_store_photo: string;

  @Column()
  address: string;

  @Column('uuid')
  lob_id: string;

  @Column({ default: true })
  pb1: boolean;

  @Column({ nullable: true })
  pb1_tariff: number;

  @Column({ nullable: true })
  npwp_no: string;

  @Column({ nullable: true })
  npwp_name: string;

  @Column({ nullable: true })
  npwp_file: string;

  @Column({ default: false })
  is_pos_checkin_enabled: boolean;

  @Column({ default: false })
  is_pos_endofday_enabled: boolean;

  @Column({ default: false })
  is_pos_printer_enabled: boolean;

  @Column({ default: false })
  is_manual_refund_enabled: boolean;

  @Column({ default: false })
  is_pos_rounded_payment: boolean;

  @Column({ default: false })
  pic_is_multilevel_login: boolean;

  @Column({ nullable: true })
  pic_name: string;

  @Column({ nullable: true })
  pic_nip: string;

  @Column({ nullable: true })
  pic_phone: string;

  @Column({ nullable: true })
  pic_email: string;

  @Column({ nullable: true })
  @Exclude()
  pic_password: string;

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.Waiting_for_approval,
  })
  status: MerchantStatus;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  rejected_at: Date;

  @ManyToOne(() => GroupDocument, (group) => group.merchants)
  @JoinColumn({ name: 'group_id' })
  group: GroupDocument;

  @OneToMany(() => StoreDocument, (store) => store.merchant)
  stores: StoreDocument[];

  @OneToMany(() => MerchantUsersDocument, (users) => users.merchant, {
    cascade: true,
  })
  users: MerchantUsersDocument[];

  user: any;

  @Column({
    type: 'enum',
    enum: PromoType,
    nullable: true,
  })
  recommended_promo_type: PromoType;

  @Column({
    type: 'enum',
    enum: DiscountType,
    nullable: true,
  })
  recommended_discount_type: DiscountType;

  @Column({ nullable: true })
  recommended_discount_value: number;

  @Column({ nullable: true, type: 'uuid' })
  recommended_discount_id: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    nullable: true,
  })
  recommended_shopping_discount_type: DiscountType;

  @Column({ nullable: true })
  recommended_shopping_discount_value: number;

  @Column({ nullable: true, type: 'uuid' })
  recommended_shopping_discount_id: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    nullable: true,
  })
  recommended_delivery_discount_type: DiscountType;

  @Column({ nullable: true })
  recommended_delivery_discount_value: number;

  @Column({ nullable: true, type: 'uuid' })
  recommended_delivery_discount_id: string;

  constructor(init?: Partial<MerchantDocument>) {
    Object.assign(this, init);
  }
}
