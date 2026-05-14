import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { remediationService } from '../services/ai/remediation.service';
import { AIProviderFactory } from '../services/ai/provider.factory';
import { scanRepository } from '../repositories/scan.repository';
import { logger } from '../utils/logger';

export const aiRouter = Router();

// ─── GET /api/ai/status ──────────────────────────────────────
// Returns current AI provider status
aiRouter.get('/status', (_req: Request, res: Response) => {
  const status = AIProviderFactory.getStatus();
  return res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/ai/fix ────────────────────────────────────────
// Generate an AI fix for a single violation (on-demand)
aiRouter.post(
  '/fix',
  [
    body('violation').isObject().withMessage('violation object is required'),
    body('violation.ruleId').isString(),
    body('htmlContext').optional().isString(),
    body('pageUrl').optional().isURL(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        timestamp: new Date().toISOString(),
      });
    }

    const { violation, htmlContext = '', pageUrl = '' } = req.body;

    try {
      const suggestion = await remediationService.generateFix({
        violation,
        htmlContext,
        pageUrl,
      });

      return res.json({
        success: true,
        data: suggestion,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[AI Route] /fix error:', err.message);
      return res.status(500).json({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// ─── POST /api/ai/explain ────────────────────────────────────
// Get a plain-English WCAG explanation for a violation
aiRouter.post(
  '/explain',
  [body('violation').isObject()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'violation object required', timestamp: new Date().toISOString() });
    }

    try {
      const explanation = await remediationService.explainViolation(req.body.violation);
      return res.json({ success: true, data: explanation, timestamp: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
    }
  }
);

// ─── GET /api/ai/summary/:scanId ─────────────────────────────
// Generate an AI executive summary for an existing scan
aiRouter.get(
  '/summary/:scanId',
  [param('scanId').isUUID()],
  async (req: Request, res: Response) => {
    const result = scanRepository.findById(req.params.scanId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Scan not found', timestamp: new Date().toISOString() });
    }

    try {
      const summary = await remediationService.summariseViolations(
        result.violations,
        result.url
      );
      return res.json({ success: true, data: summary, timestamp: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
    }
  }
);

// ─── POST /api/ai/batch-fix ──────────────────────────────────
// Generate AI fixes for multiple violations
aiRouter.post(
  '/batch-fix',
  [
    body('violations').isArray().withMessage('violations array is required'),
    body('scanId').isUUID().withMessage('valid scanId is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg, timestamp: new Date().toISOString() });
    }

    const { violations, scanId } = req.body;

    try {
      const suggestions = await remediationService.generateBatchFixes({
        violations,
        pageUrl: '', // Could be fetched from scan repository if needed
      });

      // Optionally update the scan in the repository with new suggestions
      const scan = scanRepository.findById(scanId);
      if (scan) {
        // Merge suggestions, avoiding duplicates
        const existingRuleIds = new Set(scan.aiSuggestions.map(s => s.ruleId));
        const newSuggestions = suggestions.filter(s => !existingRuleIds.has(s.ruleId));
        scan.aiSuggestions.push(...newSuggestions);
        scanRepository.update(scanId, { aiSuggestions: scan.aiSuggestions });
      }

      return res.json({
        success: true,
        data: suggestions,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[AI Route] /batch-fix error:', err.message);
      return res.status(500).json({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);
