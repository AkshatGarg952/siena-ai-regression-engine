import { Router } from 'express';
import { testCaseRepository } from '../repositories/testCaseRepository';

export const testCaseRouter = Router();

// GET /api/test-cases
testCaseRouter.get('/', async (_req, res) => {
  try {
    const cases = await testCaseRepository.getAll();
    res.json({ success: true, data: cases });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/test-cases/:id
testCaseRouter.get('/:id', async (req, res) => {
  try {
    const tc = await testCaseRepository.getById(req.params.id);
    if (!tc) {
      return res.status(404).json({ success: false, error: 'Test case not found' });
    }
    res.json({ success: true, data: tc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/test-cases
testCaseRouter.post('/', async (req, res) => {
  try {
    const { name, category, input, contextData, expectedBehavior } = req.body;
    if (!name || !category || !input || !expectedBehavior) {
      return res.status(400).json({
        success: false,
        error: 'name, category, input, and expectedBehavior are required',
      });
    }
    const created = await testCaseRepository.create({
      name,
      category,
      input,
      contextData,
      expectedBehavior,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
