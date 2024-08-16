import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, Story } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createStory(data: Prisma.StoryCreateInput): Promise<Story> {
    const newStory = await this.prisma.$transaction(async (prisma) => {
      return prisma.story.create({
        data: {
          ...data,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          version: 0,
        },
        include: {
          media: true,
        },
      });
    });
  
    await this.sendNotification(newStory);
    await this.cacheManager.del('all-stories');
    await this.cacheManager.del(`story-${newStory.id}`);
    return newStory;
  }
  
  async updateStory(id: string, data: Prisma.StoryUpdateInput): Promise<Story> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const story = await prisma.story.findUnique({
          where: { id },
        });
  
        if (!story) {
          throw new NotFoundException('Story not found.');
        }
  
        if (story.version !== data.version) {
          throw new ConflictException('Version conflict. Please refresh and try again.');
        }
  
        const updatedStory = await prisma.story.update({
          where: { id },
          data: {
            ...data,
            version: story.version + 1,
            updatedAt: new Date(),
          },
          include: {
            media: true,
          },
        });
        await this.cacheManager.del('all-stories');
        await this.cacheManager.del(`story-${id}`);
        return updatedStory;
      });
    } catch (error) {
      this.logger.error(`Error updating story with ID ${id}: ${error.message}`);
      throw error;
    }
  }
  
  async findAllStories(): Promise<Story[]> {
    const cacheKey = 'all-stories';
    const cachedStories = await this.cacheManager.get<Story[]>(cacheKey);

    if (cachedStories) {
      return cachedStories;
    }

    try {
      const stories = await this.prisma.story.findMany({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          media: true,
        },
      });

      await this.cacheManager.set(cacheKey, stories, 3600 * 24);
      return stories;
    } catch (error) {
      this.logger.error(`Error fetching stories: ${error.message}`);
      throw error;
    }
  }
  
  async findStoryById(id: string): Promise<Story | null> {
    const cacheKey = `story-${id}`;
    const cachedStory = await this.cacheManager.get<Story>(cacheKey);

    if (cachedStory) {
      return cachedStory;
    }

    try {
      const story = await this.prisma.story.findUnique({
        where: { id },
        include: {
          media: true,
        },
      });

      if (story) {
        await this.cacheManager.set(cacheKey, story, 3600 * 24);
      }

      return story;
    } catch (error) {
      this.logger.error(`Error finding story by ID ${id}: ${error.message}`);
      throw error;
    }
  }
  
  async deleteStory(id: string): Promise<Story> {
    try {
      const deletedStory = await this.prisma.story.delete({
        where: { id },
      });

      await this.cacheManager.del('all-stories');
      await this.cacheManager.del(`story-${id}`);
      return deletedStory;
    } catch (error) {
      this.logger.error(`Error deleting story with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  private async sendNotification(story: Story): Promise<void> {
    try {
      const notificationData = {
        userId: story.userId,
        message: `New story created: ${story.content}`,
        timestamp: new Date().toISOString(),
      };

      await this.notificationClient.emit('notification_event', notificationData);

      this.logger.log(`Notification sent for story ID ${story.id}`);
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }
}
