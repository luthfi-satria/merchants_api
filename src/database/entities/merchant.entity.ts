import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GroupStatus {
  Waiting_approval = 'WAITING_APPROVAL',
  Active = 'ACTIVE',
  Banned = 'BANNED',
  Rejected = 'REJECTED',
}

@Entity({ name: 'merchant_merchant' })
export class MerchantDocument {
  @PrimaryGeneratedColumn('uuid')
  id_merchant: string;

  @Column()
  group_name: string;

  @Column()
  merchant_name: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.Waiting_approval,
  })
  merchant_status: GroupStatus;

  @Column()
  owner_merchant_name: string;

  @Column()
  merchant_email: string;

  @Column()
  merchant_hp: string;

  @Column()
  merchant_address: string;

  @Column()
  upload_photo_ktp: string;

  @Column()
  nik: string;

  @Column()
  birth_city: string;

  @Column()
  dob: string;

  @Column()
  address_ktp: string;

  @Column()
  upload_photo_yourself_with_ktp: string;

  @Column()
  bank_name: string;

  @Column()
  acc_number: string;

  @Column()
  acc_name: string;

  @Column()
  upload_bankbook: string;

  @Column()
  business_name: string;

  @Column()
  business_fields: string;

  @Column()
  tarif_pb1: string;

  @Column({ type: 'date' })
  create_date: string;

  @Column({ type: 'date', nullable: true })
  approval_date: string;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
