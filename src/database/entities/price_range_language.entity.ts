import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PriceRangeDocument } from './price_range.entity';

@Entity({ name: 'merchant_price_range_language' })
export class PriceRangeLanguageDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PriceRangeDocument, (price_range) => price_range.languages)
  @JoinColumn({ name: 'price_range_id' })
  price_range: PriceRangeDocument;

  @Column('uuid')
  price_range_id: string;

  @Column()
  lang: string;

  @Column()
  name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
