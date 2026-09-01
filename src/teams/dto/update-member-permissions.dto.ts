import { IsArray, IsUUID } from 'class-validator';

export class UpdateMemberPermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}