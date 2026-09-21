import { SystemRole } from '../../common/enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  systemRole: SystemRole;
  iat?: number;
  exp?: number;
}