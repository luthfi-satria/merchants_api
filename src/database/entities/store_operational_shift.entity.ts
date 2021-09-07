import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { StoreOperationalHoursDocument } from './store_operational_hours.entity';

@Entity({ name: 'merchant_store_operational_shifts' })
export class StoreOperationalShiftDocument {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'uuid', nullable: true })
  store_operational_id?: string;

  @Column({ type: 'varchar', length: '7', default: '08:00' })
  open_hour: string;

  @Column({ type: 'varchar', length: '7', default: '17:00' })
  close_hour: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
  updated_at: Date | string;

  @ManyToOne(
    () => StoreOperationalHoursDocument,
    (operational_day) => operational_day.shifts,
  )
  @JoinColumn({ name: 'store_operational_id', referencedColumnName: 'id' })
  operational_day: StoreOperationalShiftDocument;

  constructor(init?: Partial<StoreOperationalShiftDocument>) {
    Object.assign(this, init);
  }
}
