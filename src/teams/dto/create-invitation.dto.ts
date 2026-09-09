import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { TeamRole } from '../../common/enums/role.enum';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(TeamRole)
  role!: TeamRole;
}