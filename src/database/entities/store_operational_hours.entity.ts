import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreDocument } from './store.entity';
import { StoreOperationalShiftDocument } from './store_operational_shift.entity';
@Entity({ name: 'merchants_store_operational_hours' })
@Index(['merchant_store_id', 'id'])
@Index(['merchant_store_id', 'day_of_week'])
@Index(['merchant_store_id', 'day_of_week', 'is_open', 'is_open_24h'])
export class StoreOperationalHoursDocument {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  merchant_store_id: string;

  @Index()
  @Column({ type: 'int8' }) //TODO niel- will remove this, change to day_of_weeks with verbose day ex 'mon, tue, etc.';
  day_of_week: number | string;

  @Index()
  @Column({ type: 'boolean', default: true })
  is_open: boolean;

  @Index()
  @Column({ type: 'boolean', default: false })
  is_open_24h: boolean;

  @Column({ type: 'int', default: null, nullable: true })
  gmt_offset: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
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
