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
  merchant_id: string;

  @Column('uuid')
  group_id: string;

  @Column()
  name: string;

  @Column('uuid')
  lob_id: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.Waiting_approval,
  })
  status: GroupStatus;

  @Column()
  address: string;

  @Column()
  owner_name: string;

  @Column()
  owner_email: string;

  @Column()
  owner_phone: string;

  @Column()
  owner_password: string;

  @Column()
  owner_nik: string;

  @Column({ type: 'date', nullable: true })
  owner_dob: Date;

  @Column()
  owner_dob_city: string;

  @Column()
  owner_address: string;

  @Column()
  owner_ktp: string;

  @Column()
  owner_face_ktp: string;

  @Column()
  bank_id: string;

  @Column()
  bank_acc_name: string;

  @Column()
  bank_acc_number: string;

  @Column()
  tarif_pb1: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
