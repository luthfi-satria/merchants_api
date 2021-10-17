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
import { StoreDocument } from './store.entity';

@Entity({ name: 'merchant_search_history_stores' })
export class SearchHistoryStoreDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  customer_id: string;

  @Column()
  lang: string;

  @Column({ type: 'uuid', nullable: true })
  store_id: string;

  @ManyToOne(() => StoreDocument, (store) => store.id)
  @JoinColumn({ name: 'store_id' })
  store: StoreDocument;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
