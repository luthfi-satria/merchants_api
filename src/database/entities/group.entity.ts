import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MerchantDocument } from './merchant.entity';
import { MerchantUsersDocument } from './merchant_users.entity';

export enum CategoryGroup {
  COMPANY = 'COMPANY',
  PERSONAL = 'PERSONAL',
}

export enum GroupStatus {
  Draft = 'DRAFT',
  Waiting_approval = 'WAITING_FOR_APPROVAL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Banned = 'BANNED',
  Rejected = 'REJECTED',
}

export enum DirectorIdentityType {
  KTP = 'KTP',
  PASSPORT = 'PASSPORT',
}
@Entity({ name: 'merchant_group' })
export class GroupDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CategoryGroup,
    default: CategoryGroup.COMPANY,
  })
  category: CategoryGroup;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  siup_no: string;

  @Column({ nullable: true })
  siup_file: string;

  @Column({ nullable: true })
  akta_pendirian_file: string;

  @Column({ nullable: true })
  akta_perubahan_file: string;

  @Column({ nullable: true })
  npwp_no: string;

  @Column({ nullable: true })
  npwp_file: string;

  // Direktur
  @Column({ nullable: true })
  director_name: string;

  @Column({ nullable: true })
  director_nip: string;

  @Column({ nullable: true })
  director_phone: string;

  @Column({ nullable: true })
  director_email: string;

  @Column({ nullable: true })
  director_password: string;

  @Column({
    type: 'enum',
    enum: DirectorIdentityType,
    default: DirectorIdentityType.KTP,
  })
  director_identity_type: DirectorIdentityType;

  @Column({ nullable: true })
  director_id_no: string;

  @Column({ nullable: true })
  director_id_file: string;

  @Column({ nullable: true })
  director_id_face_file: string;

  //Penanggung Jawab Operasional
  @Column({ nullable: true })
  pic_operational_name: string;

  @Column({ nullable: true })
  pic_operational_nip: string;

  @Column({ nullable: true })
  pic_operational_email: string;

  @Column({ nullable: true })
  pic_operational_phone: string;

  @Column({ nullable: true })
  pic_operational_password: string;

  //Penanggung Jawab Keuangan
  @Column({ nullable: true })
  pic_finance_name: string;

  @Column({ nullable: true })
  pic_finance_nip: string;

  @Column({ nullable: true })
  pic_finance_email: string;

  @Column({ nullable: true })
  pic_finance_phone: string;

  @Column({ nullable: true })
  pic_finance_password: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.Waiting_approval,
  })
  status: GroupStatus;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  rejected_at: Date;

  @OneToMany(() => MerchantDocument, (merchant) => merchant.group)
  merchants: Promise<MerchantDocument[]>;

  @OneToMany(
    () => MerchantUsersDocument,
    (merchant_users) => merchant_users.group,
  )
  users: MerchantUsersDocument[];

  constructor(init?: Partial<GroupDocument>) {
    Object.assign(this, init);
  }
}
