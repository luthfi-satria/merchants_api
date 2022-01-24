import { IsIn, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { LobStatus } from 'src/database/entities/lob.entity';

export class MerchantLobValidation {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;
  id: string;

  @IsOptional()
  @IsIn(Object.values(LobStatus))
  status: string;
}

export class UpdateLobValidation {
  @IsOptional()
  @Length(3, 20)
  name: string;
  id: string;

  @IsOptional()
  @IsIn(Object.values(LobStatus))
  status: string;
}
