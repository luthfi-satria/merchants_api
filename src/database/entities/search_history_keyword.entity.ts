import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'merchants_search_history_keywords' })
@Index(['keyword', 'deleted_at'])
export class SearchHistoryKeywordDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  customer_id: string;

  @Column()
  lang: string;

  @Index()
  @Column()
  keyword: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
