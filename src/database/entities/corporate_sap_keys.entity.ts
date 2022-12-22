import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupDocument } from './group.entity';

@Entity({ name: 'merchants_corporate_sap_keys' })
export class CorporateSapKeyDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  group_id: string;

  @OneToOne(() => GroupDocument, (model) => model.corporateSapKey)
  group: GroupDocument;

  @Column()
  api_key: string;

  @Column()
  secret_key: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;
}
