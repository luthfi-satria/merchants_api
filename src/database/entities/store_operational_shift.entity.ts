import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { StoreOperationalHoursDocument } from './store_operational_hours.entity';

@Entity({ name: 'merchants_store_operational_shifts' })
@Index(['store_operational_id', 'open_hour', 'close_hour'])
export class StoreOperationalShiftDocument {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  @Exclude()
  store_operational_id?: string;

  @Index()
  @Column({ type: 'varchar', length: '7', default: '08:00' })
  open_hour: string;

  @Index()
  @Column({ type: 'varchar', length: '7', default: '17:00' })
  close_hour: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
  updated_at: Date | string;

  @Index()
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
