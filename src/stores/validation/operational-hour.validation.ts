import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IStoreOperationalPayload, IStoreShiftHour } from '../types';

export class StoreOpenValidation {
  @IsNotEmpty()
  @IsBoolean()
  is_store_open: boolean;
}

export class StoreOpen24HourValidation {
  @IsNotEmpty()
  @IsBoolean()
  is_open_24_hour: boolean;
}

export class StoreShiftHours {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsNumber()
  @IsNotEmpty()
  shift_id: number;

  @IsNotEmpty()
  @IsMilitaryTime({ each: true })
  open_hour: string;

  @IsNotEmpty()
  @IsMilitaryTime({ each: true })
  close_hour: string;
}

export class StoreOpenHoursValidation implements IStoreOperationalPayload {
  @ValidateNested({ each: true })
  operational_hours: StoreShiftHours[];

  @IsNotEmpty()
  @IsString({ each: true })
  @IsIn(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], {
    message: `values day of week should in ddd format!`,
  })
  day_of_week: string;
}
