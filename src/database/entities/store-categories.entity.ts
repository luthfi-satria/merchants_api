import { StoreCategoryStatus } from 'src/store_categories/validation/store_categories.validation.dto';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LanguageDocument } from './language.entity';

@Entity({ name: 'merchants_store_categories' })
export class StoreCategoriesDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Banner+Image',
  })
  image: string;

  @OneToMany(() => LanguageDocument, (lang) => lang.store_categories, {
    cascade: ['insert', 'update'],
  })
  languages: Partial<LanguageDocument>[];

  @Column({ default: true })
  active: boolean;

  @Column({ default: 0 })
  sequence: number;

  status: StoreCategoryStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<StoreCategoriesDocument>) {
    Object.assign(this, init);
  }
}
