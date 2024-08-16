import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Story } from '@prisma/client';
import { StoryService } from '../services/story.service';
import { CreateStoryDto, UpdateStoryDto } from '../dtos/story.dto';
import { ApiTags } from '@nestjs/swagger';
import { IAuthPayload } from 'src/interfaces/auth.interface';
import { AuthUser } from 'src/decorators/auth.decorator';

@ApiTags('story')
@Controller({
  version: '1',
  path: 'story',
})
export class StoryController {
  constructor(private readonly storyService: StoryService) { }


  @Post()
  async createStory(
    @AuthUser() user: IAuthPayload,
    @Body() data: CreateStoryDto,
  ): Promise<Story> {
    const storyData = {
      ...data,
      media: {
        create: data.media.map((url) => ({ url })),
      },
    };
    return this.storyService.createStory(storyData);
  }

  @Put(':id')
  async updateStory(
    @Param('id') id: string,
    @Body() data: UpdateStoryDto,
  ): Promise<Story> {
    const storyData = {
      ...data,
      media: data.media
        ? {
          deleteMany: {},
          create: data.media.map((url) => ({ url })),
        }
        : undefined,
    };
    return this.storyService.updateStory(id, storyData);
  }

  @Get()
  async getAllStories(): Promise<Story[]> {
    return this.storyService.findAllStories();
  }

  @Get(':id')
  async getStoryById(
    @Param('id') id: string,
  ): Promise<Story | null> {
    return this.storyService.findStoryById(id);
  }

  @Delete(':id')
  async deleteStory(
    @Param('id') id: string,
  ): Promise<Story> {
    return this.storyService.deleteStory(id);
  }
}
