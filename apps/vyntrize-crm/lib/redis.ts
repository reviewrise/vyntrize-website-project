/**
 * Redis connection for BullMQ queues.
 * Uses ioredis-compatible connection options required by BullMQ.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = {
  host: (() => {
    try {
      return new URL(REDIS_URL).hostname;
    } catch {
      return 'localhost';
    }
  })(),
  port: (() => {
    try {
      return parseInt(new URL(REDIS_URL).port) || 6379;
    } catch {
      return 6379;
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
