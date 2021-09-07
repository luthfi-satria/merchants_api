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

@Entity({ name: 'merchant_store_categories' })
export class StoreCategoriesDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Banner+Image',
  })
  image: string;

  @OneToMany(() => LanguageDocument, (lang) => lang.store_categories)
  languages: Partial<LanguageDocument>[];

  // @Column()
  // name_id: string;

  // @Column()
  // name_en: string;

  @Column({ default: true })
  active: boolean;

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
