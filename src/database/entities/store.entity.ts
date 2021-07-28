import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'merchant_store' })
export class StoreDocument {
  @PrimaryGeneratedColumn('uuid')
  store_id: string;

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

  @Column()
  location_longitude: string;

  @Column()
  location_latitude: string;

  @Column()
  upload_photo: string;

  @Column()
  service_addon: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
