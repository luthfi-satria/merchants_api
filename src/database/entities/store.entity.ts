import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../helper/column_numberic_transformer';
import { AddonDocument } from './addons.entity';
import { StoreOperationalHoursDocument } from './store_operational_hours.entity';

@Entity({ name: 'merchant_store' })
export class StoreDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  merchant_id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  owner_phone: string;

  @Column()
  owner_email: string;

  @Column()
  owner_password: string;

  @Column()
  address: string;

  @Column()
  post_code: string;

  @Column()
  guidance: string;

  @Column('decimal', {
    default: '106.827153', //monas
    transformer: new ColumnNumericTransformer(),
  })
  location_longitude: number;

  @Column('decimal', {
    default: '-6.175392', //monas
    transformer: new ColumnNumericTransformer(),
  })
  location_latitude: number;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Banner+Image',
  })
  upload_photo: string;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Banner+Image',
  })
  upload_banner: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_store_open: boolean;

  @ManyToMany(() => AddonDocument)
  @JoinTable({ name: 'merchant_store_addon' })
  // @Column({ nullable: true })
  service_addon: AddonDocument[];

  // @Column({ type: 'timestamptz', nullable: true })
  // approved_at: Date | string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @OneToMany(
    () => StoreOperationalHoursDocument,
    (operational_hours) => operational_hours.store,
    { cascade: ['insert'] },
  )
  operational_hours: StoreOperationalHoursDocument[];
}
