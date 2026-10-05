import { Router } from 'express';
import { comparisonService } from '../services/comparisonService';

export const comparisonRouter = Router();

// GET /api/comparisons?baseRunId=xxx&targetRunId=yyy
// or GET /api/comparisons/:baseRunId/:targetRunId
comparisonRouter.get('/', async (req, res) => {
  try {
    const baseRunId = (req.query.baseRunId || req.query.base) as string;
    const targetRunId = (req.query.targetRunId || req.query.target) as string;

    if (!baseRunId || !targetRunId) {
      return res.status(400).json({
        success: false,
        error: 'Both baseRunId and targetRunId query parameters are required',
      });
    }

    const report = await comparisonService.compareRuns(baseRunId, targetRunId);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

comparisonRouter.get('/:baseRunId/:targetRunId', async (req, res) => {
  try {
    const { baseRunId, targetRunId } = req.params;
    const report = await comparisonService.compareRuns(baseRunId, targetRunId);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
