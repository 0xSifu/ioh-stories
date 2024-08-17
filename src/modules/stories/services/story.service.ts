import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, Story } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LockService } from './lock.service';

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
    private prisma: PrismaService,
    private configService: ConfigService,
    private lockService: LockService,
  ) {}

  async createStory(data: Prisma.StoryCreateInput): Promise<Story> {
    const lockResource = `story-create-${data.userId}`;
    const ttl = 5000;

    if (!(await this.lockService.acquireLock(lockResource, ttl))) {
      throw new ConflictException('Could not acquire lock. Please try again.');
    }

    try {
      const newStory = await this.prisma.$transaction(async (prisma) => {
        const story = await prisma.story.create({
          data: {
            ...data,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 + 7 * 60 * 60 * 1000),
            version: 0,
          },
          include: {
            media: true,
          },
        });

        await prisma.version.create({
          data: {
            storyId: story.id,
            version: 0,
          },
        });

        return story;
      });

      await this.sendNotification(newStory);
      await this.cacheManager.del('all-stories');
      await this.cacheManager.del(`story-${newStory.id}`);

      return newStory;
    } finally {
      await this.lockService.releaseLock(lockResource);
    }
  }
  
  async updateStory(id: string, data: Prisma.StoryUpdateInput): Promise<Story> {
    const lockResource = `story-update-${id}`;
    const ttl = 5000;

    if (!(await this.lockService.acquireLock(lockResource, ttl))) {
      throw new ConflictException('Could not acquire lock. Please try again.');
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const currentStory = await prisma.story.findUnique({
          where: { id },
        });

        if (!currentStory) {
          throw new NotFoundException('Story not found.');
        }

        const latestVersion = await prisma.version.findFirst({
          where: { storyId: id },
          orderBy: { createdAt: 'desc' },
        });

        if (!latestVersion) {
          throw new ConflictException('Version information not found.');
        }

        if (latestVersion.version !== currentStory.version) {
          throw new ConflictException('Version conflict. Please refresh and try again.');
        }

        const updatedStory = await prisma.story.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date(),
            version: latestVersion.version + 1,
          },
          include: {
            media: true,
          },
        });

        await prisma.version.create({
          data: {
            storyId: id,
            version: latestVersion.version + 1,
          },
        });

        await this.cacheManager.del('all-stories');
        await this.cacheManager.del(`story-${id}`);

        this.logger.log(`Story updated successfully. New version: ${latestVersion.version + 1}`);
        return updatedStory;
      });
    } finally {
      await this.lockService.releaseLock(lockResource);
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
    const lockResource = `story-delete-${id}`;
    const ttl = 5000;

    if (!(await this.lockService.acquireLock(lockResource, ttl))) {
      throw new ConflictException('Could not acquire lock. Please try again.');
    }

    try {
      const deletedStory = await this.prisma.story.delete({
        where: { id },
      });

      await this.cacheManager.del('all-stories');
      await this.cacheManager.del(`story-${id}`);

      return deletedStory;
    } finally {
      await this.lockService.releaseLock(lockResource);
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
