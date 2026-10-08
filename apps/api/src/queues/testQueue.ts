import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';

export const TEST_RUN_QUEUE_NAME = 'test-runs';

let testRunQueue: Queue | null = null;

const isRedisConfigured = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

if (isRedisConfigured) {
  try {
    testRunQueue = new Queue(TEST_RUN_QUEUE_NAME, {
      connection: redisConnectionOptions,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    testRunQueue.on('error', (err) => {
      console.warn('[BullMQ] Queue connection warning (will use fallback runner):', err.message);
    });
  } catch (err: any) {
    console.warn('[BullMQ] Failed to initialize queue with Redis:', err.message);
  }
} else {
  console.log('ℹ️ Redis not configured — BullMQ running in zero-dependency in-process mode');
}

export type RunJobData = {
  testRunId: string;
  agentVersionId: string;
};

// Registered in-process runner fallback if Redis is offline
let inProcessRunner: ((data: RunJobData) => Promise<void>) | null = null;

export function registerInProcessRunner(runner: (data: RunJobData) => Promise<void>) {
  inProcessRunner = runner;
}

export async function enqueueTestRun(data: RunJobData): Promise<string> {
  if (testRunQueue) {
    try {
      const job = await testRunQueue.add('execute-test-run', data);
      return job.id || data.testRunId;
    } catch (err: any) {
      console.warn('[BullMQ] Failed to add job to Redis queue, triggering fallback async runner:', err.message);
    }
  }

  // Fallback async runner
  if (inProcessRunner) {
    setTimeout(() => {
      inProcessRunner!(data).catch((e) => console.error('[InProcessRunner Error]', e));
    }, 100);
  }

  return data.testRunId;
}

export { testRunQueue };
