import { ListBankSeed } from 'src/banks/listbank.interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'merchant_list_banks' })
export class ListBankDocument implements ListBankSeed {
  @PrimaryGeneratedColumn('uuid')
  bank_id: string;

  @Column()
  bank_code: string;

  @Column()
  bank_name: string;
}
