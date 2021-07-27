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
  name: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.Waiting_approval,
  })
  status: GroupStatus;

  @Column()
  owner_name: string;

  @Column({ nullable: true })
  upload_photo_ktp: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
