import { Router, Request, Response } from 'express';
import { scanRepository } from '../repositories/scan.repository';
import { RuleEngine } from '../engine/rule-engine';

export const statsRouter = Router();

// ─── GET /api/stats ──────────────────────────────────────────
statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const stats = scanRepository.getStats();
    return res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
  }
});

// ─── GET /api/stats/rules ────────────────────────────────────
statsRouter.get('/rules', async (_req: Request, res: Response) => {
  const engine = new RuleEngine();
  return res.json({
    success: true,
    data: engine.getRuleMetadata(),
    timestamp: new Date().toISOString(),
  });
});
