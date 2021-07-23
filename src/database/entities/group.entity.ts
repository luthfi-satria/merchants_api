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

  @Column({ type: 'date' })
  create_date: string;

  @Column({ type: 'date', nullable: true })
  approval_date: string;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
