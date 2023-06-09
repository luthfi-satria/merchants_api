import { Exclude } from 'class-transformer';
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
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';
import { MerchantDocument } from './merchant.entity';
import { StoreDocument } from './store.entity';

export enum MerchantUsersStatus {
  Waiting_for_approval = 'WAITING_FOR_APPROVAL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Rejected = 'REJECTED',
}

@Entity({ name: 'merchants_users' })
@Index(['store_id', 'merchant_id', 'group_id'])
@Index(['store_id', 'merchant_id', 'group_id', 'id', 'role_id', 'deleted_at'])
@Index('rel_id_role_id_deleted_at_idx', ['id', 'role_id', 'deleted_at'])
@Index(['id', 'deleted_at'])
export class MerchantUsersDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Index()
  @Column('uuid', { nullable: true })
  group_id: string;

  @Index()
  @Column('uuid', { nullable: true })
  merchant_id: string;

  @Index()
  @Column('uuid', { nullable: true })
  store_id: string;

  @Column({ type: 'boolean', default: false })
  is_multilevel_login: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @ManyToOne(() => GroupDocument, (group) => group.id)
  @JoinColumn({ name: 'group_id' })
  group: GroupDocument;

  @ManyToOne(() => MerchantDocument, (merchant) => merchant.id)
  @JoinColumn({ name: 'merchant_id' })
  merchant: MerchantDocument;

  @ManyToOne(() => StoreDocument, (store) => store.id)
  @JoinColumn({ name: 'store_id' })
  store: StoreDocument;

  @Column({ nullable: true })
  @Exclude()
  token_reset_password: string;

  @Column({ nullable: true })
  nip: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  email_verified_at: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  phone_verified_at: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  rejected_at: Date;

  @Column({
    type: 'enum',
    enum: MerchantUsersStatus,
    default: MerchantUsersStatus.Waiting_for_approval,
  })
  status: MerchantUsersStatus;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column('uuid', { nullable: true })
  role_id: string;

  role_name: string;

  constructor(init?: Partial<MerchantUsersDocument>) {
    Object.assign(this, init);
  }

  @ManyToMany(() => StoreDocument, (stores) => stores.users)
  @JoinTable({
    joinColumn: {
      name: 'merchant_user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'merchant_store_id',
      referencedColumnName: 'id',
    },
  })
  stores: StoreDocument[];
}
