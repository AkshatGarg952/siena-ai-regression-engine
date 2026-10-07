import { Worker, Job } from 'bullmq';
import {
  redisConnectionOptions,
  TEST_RUN_QUEUE_NAME,
  processTestRun,
} from '@siena/shared';

export interface TestJobPayload {
  testRunId: string;
  agentVersionId: string;
}

export { processTestRun };

// BullMQ Worker Instance
export function startBullWorker(): Worker | null {
  try {
    const worker = new Worker<TestJobPayload>(
      TEST_RUN_QUEUE_NAME,
      async (job: Job<TestJobPayload>) => {
        await processTestRun(job.data);
      },
      {
        connection: redisConnectionOptions,
        concurrency: 2,
      }
    );

    worker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
      console.warn('[BullMQ Worker] Connection warning:', err.message);
    });

    return worker;
  } catch (err: any) {
    console.warn('[BullMQ Worker] Could not start worker with Redis:', err.message);
    return null;
  }
}
