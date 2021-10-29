import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';
import { StoreDocument } from './store.entity';

export enum MerchantStatus {
  Draft = 'DRAFT',
  Waiting_for_approval = 'WAITING_FOR_APPROVAL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Banned = 'BANNED',
  Rejected = 'REJECTED',
}

export enum MerchantType {
  Partner = 'PARTNER',
  Regular = 'REGULAR',
}

@Entity({ name: 'merchant_merchant' })
export class MerchantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @ManyToOne(() => GroupDocument, (merchant) => merchant.merchants)
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: GroupDocument;

  @OneToMany(() => StoreDocument, (store) => store.merchant)
  stores: StoreDocument[];

  constructor(init?: Partial<MerchantDocument>) {
    Object.assign(this, init);
  }
}
