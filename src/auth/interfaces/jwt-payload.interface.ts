import { SystemRole } from '../../common/enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  systemRole: SystemRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}