import { IsEnum } from 'class-validator';
import { TeamRole } from '../../common/enums/role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(TeamRole)
  role!: TeamRole;
}