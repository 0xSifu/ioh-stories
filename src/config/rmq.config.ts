import { registerAs } from '@nestjs/config';

export default registerAs(
  'rmq',
  (): Record<string, any> => ({
    uri: process.env.RABBITMQ_URL,
    product: process.env.RABBITMQ_PRODUCT_QUEUE,
    auth: process.env.RABBITMQ_AUTH_QUEUE,
  }),
);
