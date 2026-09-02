import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaskGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}