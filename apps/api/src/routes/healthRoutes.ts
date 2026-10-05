import { Router } from 'express';
import { prisma } from '../config/db';
import { createRedisClient } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'in-memory-fallback';
  }

  try {
    const client = createRedisClient();
    const ping = await client.ping();
    if (ping === 'PONG') redisStatus = 'connected';
    client.disconnect();
  } catch {
    redisStatus = 'in-process-fallback';
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      api: 'operational',
    },
  });
});
