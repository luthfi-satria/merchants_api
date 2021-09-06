import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreDocument } from './store.entity';
import { StoreOperationalShiftDocument } from './store_operational_shift.entity';
@Entity({ name: 'merchant_store_operational_hours' })
export class StoreOperationalHoursDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  merchant_store_id: string;

  @Column({ type: 'int8' }) //TODO niel- will remove this, change to day_of_weeks with verbose day ex 'mon, tue, etc.';
  day_of_week: number | string;

  @Column({ type: 'varchar', length: '4', nullable: true })
  day_of_weeks: string;

  @Column({ type: 'boolean', default: true })
  is_open: boolean;

  @Column({ type: 'boolean', default: false })
  is_open_24h: boolean;

  @Column({ type: 'varchar', length: '7', default: '08:00' })
  open_hour: string; // TODO: niel- remove this column

  @Column({ type: 'varchar', length: '7', default: '17:00' })
  close_hour: string; // TODO: niel- remove this column

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @ManyToOne(() => StoreDocument, (store) => store.operational_hours)
  @JoinColumn({ name: 'merchant_store_id', referencedColumnName: 'id' })
  store: StoreDocument;

  @OneToMany(
    () => StoreOperationalShiftDocument,
    (shifts) => shifts.operational_day,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  shifts: StoreOperationalShiftDocument[];

  constructor(init?: Partial<StoreOperationalHoursDocument>) {
    Object.assign(this, init);
  }
}
