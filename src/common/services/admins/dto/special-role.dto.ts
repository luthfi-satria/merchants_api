import { SpecialRoleCodes, SpecialRolesPlatforms } from '../role.service';
import { RoleDTO } from './role.dto';

export class SpecialRoleDTO {
  id: string;
  code: SpecialRoleCodes;
  name: string;
  platform: SpecialRolesPlatforms;
  role_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  role: RoleDTO;
}
