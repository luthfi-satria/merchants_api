import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreDocument } from './store.entity';

@Entity({ name: 'merchant_menus_efood' })
export class MenuEfoodDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  photo: string;

  @Column('uuid', { nullable: true })
  store_id: string;

  @Column()
  price: number;

  @OneToMany(() => StoreDocument, (store) => store.id)
  @JoinColumn({ name: 'store_id' })
  store: StoreDocument;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  created_at: Date | string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'LOCALTIMESTAMP' })
  updated_at: Date | string;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
