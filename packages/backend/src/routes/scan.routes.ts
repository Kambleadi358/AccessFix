import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { scanOrchestrator } from '../engine/scan.orchestrator';
import { scanRepository } from '../repositories/scan.repository';
import { ApiResponse, ScanResult, PaginatedResponse } from '@accessfix/shared';
import { logger } from '../utils/logger';

export const scanRouter = Router();

// ─── POST /api/scans ─────────────────────────────────────────
// Trigger a new accessibility scan
scanRouter.post(
  '/',
  [
    body('url')
      .isURL({ protocols: ['http', 'https'], require_tld: true })
      .withMessage('A valid URL with http/https protocol is required'),
    body('options').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        timestamp: new Date().toISOString(),
      } as ApiResponse<never>);
    }

    const { url, options } = req.body;

    try {
      logger.info(`Scan requested for: ${url}`);
      const result: ScanResult = await scanOrchestrator.scan({ url, options });

      // Persist to database
      if (result.status !== 'failed') {
        scanRepository.save(result);
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: `Scan completed with score ${result.score.overall}/100 (Grade: ${result.score.grade})`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<ScanResult>);
    } catch (err: any) {
      logger.error('Scan endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Scan failed unexpectedly',
        timestamp: new Date().toISOString(),
      } as ApiResponse<never>);
    }
  }
);

// ─── GET /api/scans ──────────────────────────────────────────
// List all historical scans with pagination
scanRouter.get('/', async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = Math.min(parseInt((req.query.pageSize as string) || '20', 10), 100);

  try {
    const { items, total } = scanRepository.findAll(page, pageSize);

    return res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      } as PaginatedResponse<ScanResult>,
      timestamp: new Date().toISOString(),
    } as ApiResponse<PaginatedResponse<ScanResult>>);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── GET /api/scans/:id ──────────────────────────────────────
// Get a single scan result by ID
scanRouter.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid scan ID format')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const result = scanRepository.findById(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: `Scan with ID "${req.params.id}" not found`,
          timestamp: new Date().toISOString(),
        });
      }
      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// ─── DELETE /api/scans/:id ───────────────────────────────────
scanRouter.delete(
  '/:id',
  [param('id').isUUID()],
  async (req: Request, res: Response) => {
    const deleted = scanRepository.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found',
        timestamp: new Date().toISOString(),
      });
    }
    return res.json({
      success: true,
      message: 'Scan deleted',
      timestamp: new Date().toISOString(),
    });
  }
);
