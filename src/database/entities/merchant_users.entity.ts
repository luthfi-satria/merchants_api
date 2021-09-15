import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';
import { MerchantDocument } from './merchant.entity';
import { StoreDocument } from './store.entity';

@Entity({ name: 'merchant_users' })
export class MerchantUsersDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  password: string;

  @Column('uuid', { nullable: true })
  group_id: string;

  @Column('uuid', { nullable: true })
  merchant_id: string;

  @Column('uuid', { nullable: true })
  store_id: string;

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
  token_reset_password: string;

  @Column({ nullable: true })
  nip: string;
}
