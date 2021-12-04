import { SpecialRoleDTO } from './special-role.dto';

export class SpecialRoleResponseDTO {
  success: string;
  message: string;
  data: SpecialRoleDTO;
  statusCode: number;
  error: string;
}
