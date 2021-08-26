import { Transform, Type } from 'class-transformer';
import moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';

export enum GroupStatus {
  Waiting_approval = 'WAITING_APPROVAL',
  Active = 'ACTIVE',
  Banned = 'BANNED',
  Rejected = 'REJECTED',
}

@Entity({ name: 'merchant_merchant' })
export class MerchantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Type(() => Date)
  @Transform((owner_dob: any) => moment(owner_dob).format('YYYY-MM-DD'), {
    toPlainOnly: true,
  })
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

  @Column('uuid')
  bank_id: string;

  @Column()
  bank_acc_name: string;

  @Column()
  bank_acc_number: string;

  @Column()
  tarif_pb1: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @ManyToOne(() => GroupDocument, (merchant) => merchant.merchants)
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: GroupDocument;

  constructor(init?: Partial<MerchantDocument>) {
    Object.assign(this, init);
  }
}
