import { SpecialRoleDTO } from './special-role.dto';

export class RoleDTO {
  id: string;
  name: string;
  status: string;
  platform: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  special_role: SpecialRoleDTO;
}
