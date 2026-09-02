import { IsEnum } from 'class-validator';
import { TeamRole } from '../../lib/shared/enums/role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(TeamRole)
  role!: TeamRole;
}