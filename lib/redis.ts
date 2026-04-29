import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.REDIS_URL ?? 'http://localhost:6379',
  token: process.env.REDIS_TOKEN ?? '',
});
