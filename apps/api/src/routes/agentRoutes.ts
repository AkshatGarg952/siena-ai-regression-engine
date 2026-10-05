import { Router } from 'express';
import { agentRepository } from '../repositories/agentRepository';

export const agentRouter = Router();

// GET /api/agents
agentRouter.get('/', async (_req, res) => {
  try {
    const agents = await agentRepository.getAll();
    res.json({ success: true, data: agents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agents/:id
agentRouter.get('/:id', async (req, res) => {
  try {
    const agent = await agentRepository.getById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.json({ success: true, data: agent });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents
agentRouter.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const agent = await agentRepository.create({ name, description });
    res.status(201).json({ success: true, data: agent });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agents/:id/versions
agentRouter.get('/:id/versions', async (req, res) => {
  try {
    const versions = await agentRepository.getVersions(req.params.id);
    res.json({ success: true, data: versions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents/:id/versions
agentRouter.post('/:id/versions', async (req, res) => {
  try {
    const { version, systemPrompt, sopPolicy, config } = req.body;
    if (!version || !systemPrompt || !sopPolicy) {
      return res.status(400).json({
        success: false,
        error: 'version, systemPrompt, and sopPolicy are required',
      });
    }
    const createdVersion = await agentRepository.createVersion({
      agentId: req.params.id,
      version,
      systemPrompt,
      sopPolicy,
      config,
    });
    res.status(201).json({ success: true, data: createdVersion });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
