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
  Approved = 'APPROVED',
}

@Entity({ name: 'merchant_group' })
export class GroupDocument {
  @PrimaryGeneratedColumn('uuid')
  id_group: string;

  @Column()
  group_name: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.Waiting_approval,
  })
  group_status: GroupStatus;

  @Column()
  owner_group_name: string;

  @Column({ nullable: true })
  upload_photo_ktp: string;

  @Column()
  group_email: string;

  @Column()
  group_hp: string;

  @Column()
  address_group: string;

  @Column({ type: 'timestamp', nullable: true })
  approval_date: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  create_date: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
