import { getDb } from '../database/db';
import { ScanResult, DbScan, DbViolation, DbAISuggestion } from '@accessfix/shared';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class ScanRepository {
  /**
   * Persist a complete ScanResult to SQLite.
   * Inserts into scans, violations, and ai_suggestions tables.
   */
  save(result: ScanResult): void {
    const db = getDb();

    const insertScan = db.prepare(`
      INSERT INTO scans (
        id, url, scanned_at, duration_ms, overall_score, grade, pass_rate,
        critical_count, major_count, minor_count, status, error,
        screenshot_path, page_title, page_language, raw_result
      ) VALUES (
        @id, @url, @scanned_at, @duration_ms, @overall_score, @grade, @pass_rate,
        @critical_count, @major_count, @minor_count, @status, @error,
        @screenshot_path, @page_title, @page_language, @raw_result
      )
    `);

    const insertViolation = db.prepare(`
      INSERT INTO violations (
        id, scan_id, rule_id, wcag, level, principle, title,
        severity, selector, message, how_to_fix, fixable, html_snippet
      ) VALUES (
        @id, @scan_id, @rule_id, @wcag, @level, @principle, @title,
        @severity, @selector, @message, @how_to_fix, @fixable, @html_snippet
      )
    `);

    const insertSuggestion = db.prepare(`
      INSERT INTO ai_suggestions (
        id, scan_id, rule_id, original_html, fixed_html,
        explanation, accessibility_impact, confidence
      ) VALUES (
        @id, @scan_id, @rule_id, @original_html, @fixed_html,
        @explanation, @accessibility_impact, @confidence
      )
    `);

    // Wrap in a transaction for atomicity
    const transaction = db.transaction(() => {
      insertScan.run({
        id: result.scanId,
        url: result.url,
        scanned_at: result.scannedAt,
        duration_ms: result.durationMs,
        overall_score: result.score.overall,
        grade: result.score.grade,
        pass_rate: result.score.passRate,
        critical_count: result.score.violationCounts.critical,
        major_count: result.score.violationCounts.major,
        minor_count: result.score.violationCounts.minor,
        status: result.status,
        error: result.error || null,
        screenshot_path: result.screenshotPath || null,
        page_title: result.pageTitle || null,
        page_language: result.pageLanguage || null,
        raw_result: JSON.stringify(result),
      });

      for (const v of result.violations) {
        insertViolation.run({
          id: uuidv4(),
          scan_id: result.scanId,
          rule_id: v.ruleId,
          wcag: v.wcag,
          level: v.level,
          principle: v.principle,
          title: v.title,
          severity: v.severity,
          selector: v.selector,
          message: v.message,
          how_to_fix: v.howToFix,
          fixable: v.fixable ? 1 : 0,
          html_snippet: v.htmlSnippet || null,
        });
      }

      for (const s of result.aiSuggestions) {
        insertSuggestion.run({
          id: uuidv4(),
          scan_id: result.scanId,
          rule_id: s.ruleId,
          original_html: s.originalHtml,
          fixed_html: s.fixedHtml,
          explanation: s.explanation,
          accessibility_impact: s.accessibilityImpact,
          confidence: s.confidence,
        });
      }
    });

    transaction();
    logger.info(`Scan ${result.scanId} saved to database`);
  }

  findById(scanId: string): ScanResult | null {
    const db = getDb();
    const row = db.prepare('SELECT raw_result FROM scans WHERE id = ?').get(scanId) as DbScan | undefined;
    if (!row) return null;
    return JSON.parse(row.raw_result) as ScanResult;
  }

  findAll(page = 1, pageSize = 20): { items: ScanResult[]; total: number } {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const rows = db.prepare(
      'SELECT raw_result FROM scans ORDER BY scanned_at DESC LIMIT ? OFFSET ?'
    ).all(pageSize, offset) as DbScan[];

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM scans').get() as { count: number };

    return {
      items: rows.map((r) => JSON.parse(r.raw_result) as ScanResult),
      total: totalRow.count,
    };
  }

  deleteById(scanId: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM scans WHERE id = ?').run(scanId);
    return result.changes > 0;
  }

  getStats() {
    const db = getDb();

    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalScans,
        ROUND(AVG(overall_score), 1) as averageScore,
        ROUND(AVG(critical_count), 1) as avgCritical,
        ROUND(AVG(major_count), 1) as avgMajor,
        ROUND(AVG(minor_count), 1) as avgMinor
      FROM scans WHERE status = 'completed'
    `).get() as any;

    const topViolations = db.prepare(`
      SELECT rule_id, COUNT(*) as count
      FROM violations
      GROUP BY rule_id
      ORDER BY count DESC
      LIMIT 10
    `).all() as Array<{ rule_id: string; count: number }>;

    const scoreDistribution = db.prepare(`
      SELECT
        CASE
          WHEN overall_score >= 90 THEN '90–100'
          WHEN overall_score >= 75 THEN '75–89'
          WHEN overall_score >= 60 THEN '60–74'
          WHEN overall_score >= 40 THEN '40–59'
          ELSE '0–39'
        END as range,
        COUNT(*) as count
      FROM scans
      GROUP BY range
    `).all() as Array<{ range: string; count: number }>;

    return {
      totalScans: stats?.totalScans || 0,
      averageScore: stats?.averageScore || 0,
      avgCritical: stats?.avgCritical || 0,
      avgMajor: stats?.avgMajor || 0,
      avgMinor: stats?.avgMinor || 0,
      mostCommonViolations: topViolations.map((r) => ({
        ruleId: r.rule_id,
        count: r.count,
      })),
      scoreDistribution,
    };
  }
}

export const scanRepository = new ScanRepository();
