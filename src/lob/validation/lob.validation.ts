import { IsNotEmpty, Length } from 'class-validator';

export class MerchantLobValidation {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;
  id: string;
}
