import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthEventController {
  @EventPattern(process.env.RABBITMQ_AUTH_QUEUE)
  handleAuthEvent(@Payload() data: any) {
    console.log('Received event:', data);
    // Handle the event here
  }
}
