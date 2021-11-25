import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PriceRangeLanguageDocument } from './price_range_language.entity';

@Entity({ name: 'merchant_price_range' })
export class PriceRangeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column({ default: 0 })
  price_low: number;

  @Column({ default: 0 })
  price_high: number;

  @Column({ nullable: true })
  sequence: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  @OneToMany(
    () => PriceRangeLanguageDocument,
    (languages) => languages.price_range,
    {
      cascade: true,
    },
  )
  languages: PriceRangeLanguageDocument[];
}
