import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class AssignTaskDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  assigneeIds!: string[];
}