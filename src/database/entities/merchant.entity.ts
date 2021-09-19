import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';

export enum MerchantStatus {
  Draft = 'DRAFT',
  Waiting_for_approval = 'WAITING_FOR_APPROVAL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Banned = 'BANNED',
  Rejected = 'REJECTED',
}

export enum MerchantType {
  Partner = 'PARTNER',
  Regular = 'REGULAR',
}

@Entity({ name: 'merchant_merchant' })
export class MerchantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  group_id: string;

  @Column({
    type: 'enum',
    enum: MerchantType,
    default: MerchantType.Partner,
  })
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  profile_store_photo: string;

  @Column()
  address: string;

  @Column('uuid')
  lob_id: string;

  @Column({ default: true })
  pb1: boolean;

  @Column({ nullable: true })
  pb1_tariff: number;

  @Column({ nullable: true })
  npwp_no: string;

  @Column({ nullable: true })
  npwp_name: string;

  @Column({ nullable: true })
  npwp_file: string;

  @Column({ nullable: true })
  pic_name: string;

  @Column({ nullable: true })
  pic_nip: string;

  @Column({ nullable: true })
  pic_phone: string;

  @Column({ nullable: true })
  pic_email: string;

  @Column({ nullable: true })
  pic_password: string;

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.Waiting_for_approval,
  })
  status: MerchantStatus;

  // @Type(() => Date)
  // @Transform((owner_dob: any) => moment(owner_dob).format('YYYY-MM-DD'), {
  //   toPlainOnly: true,
  // })
  // @Column({ type: 'date', nullable: true })
  // owner_dob: Date;

  // @Column()
  // owner_dob_city: string;

  // @Column()
  // owner_address: string;

  // @Column()
  // owner_ktp: string;

  // @Column()
  // owner_face_ktp: string;

  // @Column('uuid')
  // bank_id: string;

  // @Column()
  // bank_acc_name: string;

  // @Column()
  // bank_acc_number: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @ManyToOne(() => GroupDocument, (merchant) => merchant.merchants)
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: Promise<GroupDocument>;

  // user = MerchantUsersDocument;

  constructor(init?: Partial<MerchantDocument>) {
    Object.assign(this, init);
  }
}
