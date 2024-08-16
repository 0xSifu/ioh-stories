import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma, Story } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createStory(data: Prisma.StoryCreateInput): Promise<Story> {
    try {
      const newStory = await this.prisma.story.create({
        data: {
          ...data,
          createdAt: new Date(Date.now() + 7 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + (24 + 7) * 60 * 60 * 1000),
          media: {
            create: data.media?.create,
          },
        },
        include: {
          media: true,
        },
      });
  
      await this.sendNotification(newStory);
      return newStory;
    } catch (error) {
      this.logger.error(`Error creating story: ${error.message}`);
      throw error;
    }
  }
  
  async findAllStories(): Promise<Story[]> {
    try {
      return await this.prisma.story.findMany({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          media: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching stories: ${error.message}`);
      throw error;
    }
  }
  
  async findStoryById(id: string): Promise<Story | null> {
    try {
      return await this.prisma.story.findUnique({
        where: { id },
        include: {
          media: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error finding story by ID ${id}: ${error.message}`);
      throw error;
    }
  }
  

  async updateStory(id: string, data: Prisma.StoryUpdateInput): Promise<Story> {
    try {
      const { media, ...rest } = data;
  
      const mediaUpdate: Prisma.MediaUpdateManyWithoutStoryNestedInput = media
        ? {
            deleteMany: {},
            create: media.create,
          }
        : {};

      const updatedStory = await this.prisma.story.update({
        where: { id },
        data: {
          ...rest,
          media: mediaUpdate,
          updatedAt: new Date(),
        },
        include: { media: true },
      });
  
      return updatedStory;
    } catch (error) {
      this.logger.error(`Error updating story: ${error.message}`);
      throw error;
    }
  }
  
  
  async deleteStory(id: string): Promise<Story> {
    try {
      return await this.prisma.story.delete({
        where: { id },
      });
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
