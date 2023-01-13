import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreDocument } from './store.entity';

@Entity({ name: 'merchants_menu_onlines' })
@Index(['store_id', 'deleted_at'])
@Index(['store_id', 'menu_id', 'deleted_at'])
export class MenuOnlineDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  menu_store_id: string;

  @Column('uuid', { nullable: true })
  menu_price_id: string;

  @Index()
  @Column('uuid', { nullable: true })
  menu_id: string;

  @Column()
  name: string;

  @Column()
  photo: string;

  @Column()
  price: number;

  @Index()
  @Column()
  store_id: string;

  @ManyToOne(() => StoreDocument, (store) => store.menus)
  @JoinColumn({ name: 'store_id' })
  store: StoreDocument;

  @Column({ nullable: true })
  discounted_price: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @Index()
  @DeleteDateColumn({ nullable: true, select: false })
  deleted_at: Date;
}
