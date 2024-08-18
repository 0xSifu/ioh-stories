import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { FollowService } from './services/follow.service';
import { FollowController } from './controllers/follow.controller';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthEventController } from './controllers/auth-event.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_AUTH_QUEUE,
          queueOptions: { durable: false },
        },
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
  ],
  controllers: [FollowController, AuthEventController],
  providers: [FollowService, PrismaService],
  exports: [FollowService],
})
export class FollowModule {}
