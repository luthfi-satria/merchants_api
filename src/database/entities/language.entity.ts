import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreCategoriesDocument } from './store-categories.entity';

@Entity({ name: 'merchants_store_category_languages' })
@Index(['storeCategoriesId', 'deleted_at'])
export class LanguageDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column({ type: 'uuid' })
  // store_category_id: string;

  @Column()
  lang: string;

  @Column()
  name: string;

  @Column('uuid')
  @Index()
  storeCategoriesId: string;

  @ManyToOne(() => StoreCategoriesDocument, (stocat) => stocat.languages)
  store_categories: StoreCategoriesDocument;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
