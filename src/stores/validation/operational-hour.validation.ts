import {
  IsBoolean,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
} from 'class-validator';
import { IStoreOperationalPayload } from '../types';

export class StoreOpenValidation {
  @IsNotEmpty()
  @IsBoolean()
  is_store_open: boolean;
}

export class StoreOpen24HourValidation {
  @IsNotEmpty()
  @IsBoolean()
  open_24_hour: boolean;
}

export class StoreOpenHoursValidation implements IStoreOperationalPayload {
  @IsNotEmpty()
  @IsMilitaryTime({ each: true })
  // @IsLowerThan('open_hour', { each: true })
  close_hour;

  @IsNotEmpty()
  @IsMilitaryTime({ each: true })
  // @IsBiggerThan('close_hour', { each: true })
  open_hour;

  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  day_of_week;
}
