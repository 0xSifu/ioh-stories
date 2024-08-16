import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({
    description: 'The ID of the user creating the story',
    example: '60b7cddc6b6b5c001cf53b21',
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: 'The content of the story',
    example: 'This is a story content example.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class UpdateStoryDto {
  @ApiProperty({
    description: 'The updated content of the story (optional)',
    example: 'This is an updated story content example.',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class ViewStoryDto {
  @ApiProperty({
    description: 'The ID of the story',
    example: '60b7cddc6b6b5c001cf53b22',
  })
  @IsNotEmpty()
  @IsMongoId()
  storyId: string;

  @ApiProperty({
    description: 'The ID of the user who created the story',
    example: '60b7cddc6b6b5c001cf53b21',
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: 'The content of the story',
    example: 'This is the content of the viewed story.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'The creation date of the story',
    example: '2024-08-15T10:00:00.000Z',
  })
  createdAt: Date;
}
