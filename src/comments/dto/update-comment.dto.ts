import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'I have updated this comment.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
