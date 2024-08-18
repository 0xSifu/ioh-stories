import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { Lock } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async acquireLock(resource: string, ttlSeconds: number): Promise<boolean> {
    this.logger.log(`Attempting to acquire lock for resource: ${resource}`);
    const ttlDate = new Date(Date.now() + ttlSeconds * 1000);

    try {
      const existingLock = await this.prisma.lock.findFirst({
        where: { resource },
      });

      if (existingLock) {
        await this.prisma.lock.update({
          where: { id: existingLock.id },
          data: { ttl: ttlDate },
        });
        this.logger.log(`Lock updated for resource: ${resource}, expires at ${ttlDate.toISOString()}`);
      } else {
        await this.prisma.lock.create({
          data: { resource, ttl: ttlDate },
        });
        this.logger.log(`Lock created for resource: ${resource}, expires at ${ttlDate.toISOString()}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to acquire lock for resource: ${resource}. Error: ${error.message}`);
      return false;
    }
  }

  async releaseLock(resource: string): Promise<void> {
    this.logger.log(`Releasing lock for resource: ${resource}`);

    try {
      const existingLock = await this.prisma.lock.findFirst({
        where: { resource },
      });

      if (existingLock) {
        await this.prisma.lock.delete({
          where: { id: existingLock.id },
        });
        this.logger.log(`Lock released for resource: ${resource}`);
      } else {
        this.logger.warn(`No lock found to release for resource: ${resource}`);
      }
    } catch (error) {
      this.logger.error(`Failed to release lock for resource: ${resource}. Error: ${error.message}`);
    }
  }

  async isLockActive(resource: string): Promise<boolean> {
    this.logger.log(`Checking if lock is active for resource: ${resource}`);

    const lock = await this.prisma.lock.findFirst({
      where: { resource },
    });

    if (lock && lock.ttl > new Date()) {
      this.logger.log(`Lock is active for resource: ${resource}, expires at ${lock.ttl.toISOString()}`);
      return true;
    }

    this.logger.log(`No active lock found for resource: ${resource}`);
    return false;
  }
}
