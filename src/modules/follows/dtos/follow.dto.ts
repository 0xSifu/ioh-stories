import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateFollowDto {
  @IsNotEmpty()
  @IsMongoId()
  followerId: string;

  @IsNotEmpty()
  @IsMongoId()
  followingId: string;
}

export class DeleteFollowDto {
  @IsNotEmpty()
  @IsMongoId()
  followerId: string;

  @IsNotEmpty()
  @IsMongoId()
  followingId: string;
}

export class ViewFollowDto {
  @IsNotEmpty()
  @IsMongoId()
  id: string;

  @IsNotEmpty()
  @IsMongoId()
  followerId: string;

  @IsNotEmpty()
  @IsMongoId()
  followingId: string;

  createdAt: Date;
}
