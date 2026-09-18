import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'I have updated this comment.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
