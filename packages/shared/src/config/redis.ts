import Redis from 'ioredis';

export const redisConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 100, 1000);
  },
};

export const createRedisClient = () => {
  return new Redis(redisConnectionOptions);
};

export const TEST_RUN_QUEUE_NAME = 'test-runs';
