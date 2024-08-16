import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma, Follow } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FollowService {
    private readonly logger = new Logger(FollowService.name);

    constructor(
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.initialize();
    }

    async initialize() {
        try {
            await this.authClient.connect();
            this.logger.log('Connected to RabbitMQ');
        } catch (error) {
            this.logger.error('Error connecting to RabbitMQ:', error);
        }
    }

    async createFollow(data: Prisma.FollowCreateInput): Promise<Follow> {
        try {
            const newFollow = await this.prisma.follow.create({ data });
            await this.sendNotification(newFollow);
            return newFollow;
        } catch (error) {
            this.logger.error(`Error creating follow: ${error.message}`);
            throw error;
        }
    }

    async findAllFollows(): Promise<Follow[]> {
        try {
            return await this.prisma.follow.findMany();
        } catch (error) {
            this.logger.error(`Error fetching follows: ${error.message}`);
            throw error;
        }
    }

    async findFollowById(id: string): Promise<Follow | null> {
        try {
            return await this.prisma.follow.findUnique({ where: { id } });
        } catch (error) {
            this.logger.error(`Error finding follow by ID ${id}: ${error.message}`);
            throw error;
        }
    }

    async deleteFollow(id: string): Promise<Follow> {
        try {
            return await this.prisma.follow.delete({ where: { id } });
        } catch (error) {
            this.logger.error(`Error deleting follow with ID ${id}: ${error.message}`);
            throw error;
        }
    }

    private async sendNotification(follow: Follow): Promise<void> {
        try {
            const notificationData = {
                userId: follow.followingId,
                message: `You have a new follower!`,
                timestamp: new Date().toISOString(),
            };

            await this.authClient.emit('notification_event', notificationData);

            this.logger.log(`Notification sent for follow ID ${follow.id}`);
        } catch (error) {
            this.logger.error(`Error sending notification: ${error.message}`);
        }
    }
}
