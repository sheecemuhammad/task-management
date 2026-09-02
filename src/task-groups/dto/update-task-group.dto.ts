import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTaskGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}