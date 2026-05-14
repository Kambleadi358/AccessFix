import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { ScanResult, ScanRequest, ScanOptions, AIFixSuggestion } from '@accessfix/shared';
import { puppeteerEngine } from './puppeteer.engine';
import { RuleEngine } from './rule-engine';
import { scoringEngine } from './scoring.engine';
import { aiEngine } from './ai.engine';
import { logger } from '../utils/logger';

/**
 * ScanOrchestrator — the main pipeline:
 *
 *  1. Render page with Puppeteer
 *  2. Parse DOM with Cheerio
 *  3. Run WCAG rule engine
 *  4. Calculate accessibility score
 *  5. Generate AI fix suggestions
 *  6. Return structured ScanResult
 */
export class ScanOrchestrator {
  async scan(request: ScanRequest): Promise<ScanResult> {
    const scanId = uuidv4();
    const startTime = Date.now();
    const opts: ScanOptions = request.options || {};

    logger.info(`[${scanId}] Starting scan for: ${request.url}`);

    try {
      // ── Step 1: Render page ─────────────────────────────
      const rendered = await puppeteerEngine.render(request.url, opts);

      if ('status' in rendered && rendered.status === 'failed') {
        return {
          scanId,
          url: request.url,
          scannedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          score: this.emptyScore(),
          violations: [],
          aiSuggestions: [],
          status: 'failed',
          error: `${rendered.reason}: ${rendered.details || ''}`,
        };
      }

      // Type guard for TS
      const page = rendered as any;

      // ── Step 2: Parse DOM with Cheerio ──────────────────
      const $ = cheerio.load(page.html);

      // ── Step 3: Run WCAG Rule Engine ────────────────────
      const ruleEngine = new RuleEngine(opts.skipRules);
      const violations = ruleEngine.run({
        $,
        html: page.html,
        url: rendered.url,
      });

      // ── Step 4: Calculate score ─────────────────────────
      const score = scoringEngine.calculate(violations, ruleEngine.getRuleMetadata().length);

      // ── Step 5: AI suggestions (pass HTML context for better fixes) ──
      let aiSuggestions: AIFixSuggestion[] = [];
      if (opts.enableAI !== false) {
        aiSuggestions = await aiEngine.generateSuggestions(
          violations,
          rendered.url,
          page.html
        );
      }

      const durationMs = Date.now() - startTime;
      logger.info(`[${scanId}] Scan complete in ${durationMs}ms — Score: ${score.overall}/100 (${score.grade})`);

      const result: ScanResult = {
        scanId,
        url: rendered.url,
        scannedAt: new Date().toISOString(),
        durationMs,
        score,
        violations,
        aiSuggestions,
        screenshotPath: page.screenshotPath
          ? `/screenshots/${page.screenshotPath.split('/').pop()}`
          : undefined,
        pageTitle: page.pageTitle,
        pageLanguage: page.pageLanguage,
        status: 'completed',
      };

      return result;
    } catch (err: any) {
      logger.error(`[${scanId}] Scan failed:`, err);

      return {
        scanId,
        url: request.url,
        scannedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        score: this.emptyScore(),
        violations: [],
        aiSuggestions: [],
        status: 'failed',
        error: err.message || 'Scan failed',
      };
    }
  }

  private emptyScore() {
    return {
      overall: 0,
      byPrinciple: {
        Perceivable: 0,
        Operable: 0,
        Understandable: 0,
        Robust: 0,
      },
      violationCounts: { critical: 0, major: 0, minor: 0, total: 0 },
      grade: 'F' as const,
      passRate: 0,
    };
  }
}


export const scanOrchestrator = new ScanOrchestrator();
