import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFollowDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  followerId: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c86' })
  @IsNotEmpty()
  @IsMongoId()
  followingId: string;
}

export class DeleteFollowDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  followerId: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c86' })
  @IsNotEmpty()
  @IsMongoId()
  followingId: string;
}

export class ViewFollowDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c87' })
  @IsNotEmpty()
  @IsMongoId()
  id: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  followerId: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c86' }) 
  @IsNotEmpty()
  @IsMongoId()
  followingId: string;

  @ApiProperty({ example: '2024-08-16T12:39:07.873Z' })
  createdAt: Date;
}
