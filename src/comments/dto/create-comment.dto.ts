import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'This task looks good. I have completed the API review.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description:
      'Parent comment UUID. Leave empty to create a top-level comment.',
    example: '586d08d2-c713-412f-8857-cfc77063d70c',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}