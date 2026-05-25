/**
 * Redis connection for BullMQ queues.
 * Uses ioredis-compatible connection options required by BullMQ.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6380';

export const redisConnection = {
  host: (() => {
    try {
      return new URL(REDIS_URL).hostname;
    } catch {
      return '127.0.0.1';
    }
  })(),
  port: (() => {
    try {
      return parseInt(new URL(REDIS_URL).port) || 6380;
    } catch {
      return 6380;
    }
  })(),
  password: (() => {
    try {
      return new URL(REDIS_URL).password || undefined;
    } catch {
      return undefined;
    }
  })(),
  maxRetriesPerRequest: null, // Required by BullMQ
};
