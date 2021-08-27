import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'merchant_store_categories' })
export class StoreCategoriesDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    default: 'https://dummyimage.com/600x400/968a96/ffffff&text=Banner+Image',
  })
  image: string;

  @Column()
  name_id: string;

  @Column()
  name_en: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;
}
