import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Follow } from '@prisma/client';
import { FollowService } from '../services/follow.service';
import { CreateFollowDto, DeleteFollowDto, ViewFollowDto } from '../dtos/follow.dto';
import { ApiTags } from '@nestjs/swagger';
import { IAuthPayload } from 'src/interfaces/auth.interface';
import { AuthUser } from 'src/decorators/auth.decorator';
import { GenericResponseDto } from '../dtos/generic.response.dto';

@ApiTags('follow')
@Controller({
  version: '1',
  path: 'follow',
})
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  async createFollow(
    @AuthUser() user: IAuthPayload,
    @Body() data: CreateFollowDto,
  ): Promise<Follow> {
    return this.followService.createFollow(data);
  }

  @Get()
  async getAllFollows(): Promise<Follow[]> {
    return this.followService.findAllFollows();
  }

  @Get(':id')
  async getFollowById(
    @Param('id') id: string,
  ): Promise<Follow | null> {
    return this.followService.findFollowById(id);
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
  ): Promise<ViewFollowDto[]> {
    const followers = await this.followService.findFollowers(userId);
    return followers.map(follow => ({
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt,
    }));
  }

  @Delete(':id')
  async deleteFollow(
    @Param('id') id: string,
  ): Promise<GenericResponseDto> {
    await this.followService.deleteFollow(id);
    return { status: true, message: 'Follow relationship deleted successfully.' };
  }
}
