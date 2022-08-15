import { IsOptional } from 'class-validator';

export class RejectCorporateDto {
  @IsOptional()
  cancellation_reason_of_information: string;

  @IsOptional()
  cancellation_reason_of_document: string;

  @IsOptional()
  cancellation_reason_of_type_and_service: string;

  @IsOptional()
  cancellation_reason_of_responsible_person: string;
}