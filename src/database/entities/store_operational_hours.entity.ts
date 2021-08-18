import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreDocument } from './store.entity';

@Entity({ name: 'merchant_store_operational_hours' })
export class StoreOperationalHoursDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  merchant_store_id: string;

  @Column({ type: 'int8' })
  day_of_week: number;

  @Column({ type: 'boolean', default: true })
  is_open: boolean;

  @Column({ type: 'boolean', default: false })
  is_open_24h: boolean;

  @Column({ type: 'varchar', length: '7', default: '08:00' })
  open_hour: string;

  @Column({ type: 'varchar', length: '7', default: '17:00' })
  close_hour: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @ManyToMany(() => StoreDocument, (store) => store.operational_hours)
  @JoinColumn({ name: 'merchant_store_id', referencedColumnName: 'id' })
  store: StoreDocument;
}
