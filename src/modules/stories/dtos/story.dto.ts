import { IsNotEmpty, IsString, IsMongoId, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'An array of media URLs associated with the story',
    example: ['https://example.com/media1.jpg', 'https://example.com/media2.jpg'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  media: string[];
}

export class UpdateStoryDto extends PartialType(CreateStoryDto) {
  @ApiProperty({
    description: 'The updated content of the story (optional)',
    example: 'This is an updated story content example.',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'List of media URLs associated with the story',
    example: ['https://example.com/media1.jpg', 'https://example.com/media2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media?: string[];

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
    description: 'An array of media URLs associated with the story',
    example: ['https://example.com/media1.jpg', 'https://example.com/media2.jpg'],
  })
  media: string[];

  @ApiProperty({
    description: 'The creation date of the story',
    example: '2024-08-15T10:00:00.000Z',
  })
  createdAt: Date;
}

export class FollowedUsersStoriesDto {
  @ApiProperty({
    description: 'The ID of the user requesting followed stories',
    example: '60b7cddc6b6b5c001cf53b21',
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}