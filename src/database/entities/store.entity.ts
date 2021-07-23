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
  id_store: string;

  @Column()
  group_name: string;

  @Column()
  merchant_name: string;

  @Column()
  store_name: string;

  @Column()
  store_phone: string;

  @Column()
  store_hp: string;

  @Column()
  store_email: string;

  @Column()
  email_settlement: string;

  @Column()
  address_store: string;

  @Column()
  post_code: string;

  @Column()
  guidance: string;

  @Column()
  longitude_latitude: string;

  @Column()
  upload_photo_store: string;

  @Column()
  services_addon: string;

  @Column()
  toc: string;

  @Column({ type: 'date' })
  create_date: string;

  @Column({ type: 'date', nullable: true })
  approval_date: string;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
