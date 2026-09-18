import { SystemRole } from '../../../common/enums/role.enum';

export interface RealtimeSocketUser {
  id: string;
  systemRole: SystemRole;
}
