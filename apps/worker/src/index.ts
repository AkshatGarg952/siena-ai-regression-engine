import dotenv from 'dotenv';
import { startBullWorker } from './worker';

dotenv.config();

console.log('👷 Siena Agent Evaluation Worker starting...');

const worker = startBullWorker();

if (worker) {
  console.log('✅ BullMQ Worker listening on Redis queue: test-runs');
} else {
  console.log('⚠️ Running in fallback queue mode (Redis not connected)');
}

process.on('SIGINT', async () => {
  console.log('Stopping worker...');
  if (worker) await worker.close();
  process.exit(0);
});
