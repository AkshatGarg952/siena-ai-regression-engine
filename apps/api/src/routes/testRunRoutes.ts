import { Router } from 'express';
import { testRunRepository } from '../repositories/testRunRepository';
import { testCaseRepository } from '../repositories/testCaseRepository';
import { agentRepository } from '../repositories/agentRepository';
import { enqueueTestRun } from '../queues/testQueue';

export const testRunRouter = Router();

// GET /api/test-runs
testRunRouter.get('/', async (_req, res) => {
  try {
    const runs = await testRunRepository.getAll();
    res.json({ success: true, data: runs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/test-runs/:id
testRunRouter.get('/:id', async (req, res) => {
  try {
    const run = await testRunRepository.getById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    res.json({ success: true, data: run });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/test-runs/:id/results
testRunRouter.get('/:id/results', async (req, res) => {
  try {
    const results = await testRunRepository.getResultsByRunId(req.params.id);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/test-runs
// Asynchronous pattern: creates record with PENDING, enqueues to Redis BullMQ, returns immediately with run_id
testRunRouter.post('/', async (req, res) => {
  try {
    const { agentVersionId } = req.body;
    if (!agentVersionId) {
      return res.status(400).json({ success: false, error: 'agentVersionId is required' });
    }

    const version = await agentRepository.getVersionById(agentVersionId);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Agent version not found' });
    }

    const testCases = await testCaseRepository.getAll();
    const totalTests = testCases.length;

    // Create the test run in PENDING status
    const run = await testRunRepository.create({
      agentVersionId,
      totalTests,
    });

    // Enqueue job asynchronously via BullMQ / Redis
    await enqueueTestRun({
      testRunId: run.id,
      agentVersionId,
    });

    // Return IMMEDIATELY with run_id and status PENDING
    res.status(202).json({
      success: true,
      data: {
        run_id: run.id,
        status: run.status,
        totalTests,
        message: 'Test run enqueued successfully. Processing asynchronously.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
