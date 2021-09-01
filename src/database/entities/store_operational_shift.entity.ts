import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StoreOperationalHoursDocument } from './store_operational_hours.entity';

@Entity({ name: 'merchant_store_operational_shifts' })
export class StoreOperationalShiftDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  store_operational_id: string;

  @Column({ type: 'varchar', length: '7', default: '08:00' })
  open_hour: string;

  @Column({ type: 'varchar', length: '7', default: '17:00' })
  close_hour: string;

  @ManyToOne(
    () => StoreOperationalHoursDocument,
    (operational_day) => operational_day.shifts,
  )
  @JoinColumn({ name: 'store_operational_id', referencedColumnName: 'id' })
  operational_day: StoreOperationalShiftDocument;
}
