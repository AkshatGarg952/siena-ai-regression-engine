import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerInProcessRunner } from './queues/testQueue';
import { processTestRun } from '@siena/shared';
import { healthRouter } from './routes/healthRoutes';
import { agentRouter } from './routes/agentRoutes';
import { testCaseRouter } from './routes/testCaseRoutes';
import { testRunRouter } from './routes/testRunRoutes';
import { comparisonRouter } from './routes/comparisonRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Register in-process runner for fallback async execution
registerInProcessRunner(processTestRun);

// API Routes
app.use('/api', healthRouter);
app.use('/api/agents', agentRouter);
app.use('/api/test-cases', testCaseRouter);
app.use('/api/test-runs', testRunRouter);
app.use('/api/comparisons', comparisonRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Siena AI - Agent Regression & Evaluation Engine API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/agents',
      '/api/test-cases',
      '/api/test-runs',
      '/api/comparisons',
    ],
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`🚀 Siena Regression API Server listening on port ${PORT}`);
    try {
      const { seedInitialData } = await import('@siena/shared');
      await seedInitialData();
    } catch (err) {
      console.warn('Auto-seed warning:', err);
    }
  });
}

export default app;
