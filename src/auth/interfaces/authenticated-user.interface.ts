import { SystemRole } from '../../common/enums/role.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  systemRole: SystemRole;
}
