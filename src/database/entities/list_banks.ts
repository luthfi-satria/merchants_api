import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'merchant_list_banks' })
export class ListBankDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bank_code: string;

  @Column()
  bank_name: string;
}
