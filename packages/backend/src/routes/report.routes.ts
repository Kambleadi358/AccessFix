import { Router, Request, Response } from 'express';
import { scanRepository } from '../repositories/scan.repository';
import { ReportService } from '../services/report.service';
import { remediationReportService } from '../services/remediation-report.service';
import { logger } from '../utils/logger';

export const reportRouter = Router();
const reportService = new ReportService();

// ─── GET /api/reports/:scanId/json ───────────────────────────
reportRouter.get('/:scanId/json', async (req: Request, res: Response) => {
  const result = scanRepository.findById(req.params.scanId);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Scan not found', timestamp: new Date().toISOString() });
  }

  res.setHeader('Content-Disposition', `attachment; filename="accessfix-report-${req.params.scanId}.json"`);
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify(result, null, 2));
});

// ─── GET /api/reports/:scanId/csv ────────────────────────────
reportRouter.get('/:scanId/csv', async (req: Request, res: Response) => {
  const result = scanRepository.findById(req.params.scanId);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Scan not found', timestamp: new Date().toISOString() });
  }

  const csv = reportService.generateCSV(result);
  res.setHeader('Content-Disposition', `attachment; filename="accessfix-report-${req.params.scanId}.csv"`);
  res.setHeader('Content-Type', 'text/csv');
  return res.send(csv);
});

// ─── GET /api/reports/:scanId/html ───────────────────────────
reportRouter.get('/:scanId/html', async (req: Request, res: Response) => {
  const result = scanRepository.findById(req.params.scanId);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Scan not found', timestamp: new Date().toISOString() });
  }

  const html = reportService.generateHTML(result);
  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

// ─── GET /api/reports/:scanId/remediation ────────────────────
reportRouter.get('/:scanId/remediation', async (req: Request, res: Response) => {
  const result = scanRepository.findById(req.params.scanId);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Scan not found', timestamp: new Date().toISOString() });
  }

  // Use only violations that have AI suggestions or are selected (default to all if not specified)
  const selectedRuleIds = req.query.rules ? (req.query.rules as string).split(',') : [];
  
  const selectedViolations = selectedRuleIds.length > 0 
    ? result.violations.filter(v => selectedRuleIds.includes(v.ruleId))
    : result.violations.filter(v => result.aiSuggestions.some(s => s.ruleId === v.ruleId));

  const html = remediationReportService.generateRemediationReport(result, selectedViolations, result.aiSuggestions);
  
  res.setHeader('Content-Disposition', `attachment; filename="fixed-report-${req.params.scanId}.html"`);
  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});
