import { ScanResult } from '@accessfix/shared';
import { puppeteerEngine } from '../engine/puppeteer.engine';
import { logger } from '../utils/logger';

export class ReportService {
  /**
   * Main entry point for report generation.
   */
  async generateReport(format: 'csv' | 'html' | 'pdf', result: ScanResult): Promise<string | Buffer> {
    logger.info(`[ReportService] Generating ${format.toUpperCase()} report for scan ${result.scanId}`);
    
    switch (format) {
      case 'csv':
        return this.generateCSV(result);
      case 'pdf':
        return await this.generatePDF(result);
      case 'html':
      default:
        return this.generateHTML(result);
    }
  }

  /** Generate a self-contained PDF using Puppeteer */
  async generatePDF(result: ScanResult): Promise<Buffer> {
    const htmlContent = this.generateHTML(result);
    
    // Inject PDF-specific styles for better printing
    const styledHtml = htmlContent.replace('</head>', `
      <style>
        body { background: white; color: black; }
        .container { max-width: 100%; padding: 1rem; }
        header, .score-card { background: #f8fafc; border: 1px solid #e2e8f0; }
        h1, h2 { color: #020617; }
        table { background: white; color: black; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; color: #475569; }
        td { border-top: 1px solid #e2e8f0; }
        @media print {
          .score-grid { display: flex; flex-wrap: wrap; }
          .score-card { width: 30%; margin: 1%; page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>`);

    await puppeteerEngine.launch();
    // Use an internal page from the engine to render the PDF
    const browser = (puppeteerEngine as any).browser;
    const page = await browser.newPage();
    
    try {
      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">AccessFix - Accessibility Audit Report</div>',
        footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  /** Generate a detailed CSV of all violations */
  generateCSV(result: ScanResult): string {
    const header = [
      'Rule ID', 'WCAG', 'Level', 'Principle', 'Severity',
      'Title', 'Selector', 'Message', 'How to Fix', 'Fixable',
    ].join(',');

    const rows = result.violations.map((v) =>
      [
        this.csv(v.ruleId),
        this.csv(v.wcag),
        this.csv(v.level),
        this.csv(v.principle),
        this.csv(v.severity),
        this.csv(v.title),
        this.csv(v.selector),
        this.csv(v.message),
        this.csv(v.howToFix),
        v.fixable ? 'Yes' : 'No',
      ].join(',')
    );

    const summary = [
      `# AccessFix Accessibility Report`,
      `# URL: ${result.url}`,
      `# Scanned: ${result.scannedAt}`,
      `# Score: ${result.score.overall}/100 (Grade: ${result.score.grade})`,
      `# Critical: ${result.score.violationCounts.critical} | Major: ${result.score.violationCounts.major} | Minor: ${result.score.violationCounts.minor}`,
      '',
    ].join('\n');

    return `${summary}${header}\n${rows.join('\n')}`;
  }

  /** Generate a self-contained HTML report */
  generateHTML(result: ScanResult): string {
    const scoreColor =
      result.score.overall >= 90 ? '#22c55e'
      : result.score.overall >= 75 ? '#84cc16'
      : result.score.overall >= 60 ? '#f59e0b'
      : result.score.overall >= 40 ? '#f97316'
      : '#ef4444';

    const violationRows = result.violations
      .map(
        (v) => `
        <tr>
          <td><span class="badge ${v.severity.toLowerCase()}">${v.severity}</span></td>
          <td>${this.esc(v.wcag)}</td>
          <td>${this.esc(v.title)}</td>
          <td><code>${this.esc(v.selector)}</code></td>
          <td>${this.esc(v.message)}</td>
          <td>${this.esc(v.howToFix)}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AccessFix Report — ${this.esc(result.url)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; }
    h1 { font-size: 2rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.5rem; }
    .meta { color: #94a3b8; font-size: 0.9rem; }
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .score-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.5rem; text-align: center; }
    .score-value { font-size: 2.5rem; font-weight: 800; color: ${scoreColor}; }
    .score-label { color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.critical { background: #450a0a; color: #fca5a5; }
    .badge.major { background: #431407; color: #fdba74; }
    .badge.minor { background: #1c1917; color: #d6d3d1; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 10px; overflow: hidden; margin-bottom: 2rem; }
    th { background: #334155; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    td { padding: 0.75rem 1rem; border-top: 1px solid #334155; font-size: 0.875rem; vertical-align: top; }
    code { background: #0f172a; padding: 0.1rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; color: #38bdf8; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #f1f5f9; }
    footer { text-align: center; color: #475569; font-size: 0.8rem; padding-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 AccessFix Accessibility Report</h1>
      <p class="meta">URL: <strong>${this.esc(result.url)}</strong></p>
      <p class="meta">Scanned: ${new Date(result.scannedAt).toLocaleString()} · Duration: ${result.durationMs}ms</p>
    </header>

    <div class="score-grid">
      <div class="score-card">
        <div class="score-value">${result.score.overall}</div>
        <div class="score-label">Accessibility Score / 100</div>
      </div>
      <div class="score-card">
        <div class="score-value" style="color:#94a3b8">${result.score.grade}</div>
        <div class="score-label">Grade</div>
      </div>
      <div class="score-card">
        <div class="score-value" style="color:#fca5a5">${result.score.violationCounts.critical}</div>
        <div class="score-label">Critical Violations</div>
      </div>
      <div class="score-card">
        <div class="score-value" style="color:#fdba74">${result.score.violationCounts.major}</div>
        <div class="score-label">Major Violations</div>
      </div>
      <div class="score-card">
        <div class="score-value" style="color:#94a3b8">${result.score.violationCounts.minor}</div>
        <div class="score-label">Minor Violations</div>
      </div>
      <div class="score-card">
        <div class="score-value" style="color:#38bdf8">${result.score.passRate}%</div>
        <div class="score-label">Rules Passed</div>
      </div>
    </div>

    <h2>Violations (${result.violations.length})</h2>
    <table>
      <thead>
        <tr><th>Severity</th><th>WCAG</th><th>Rule</th><th>Selector</th><th>Issue</th><th>Fix</th></tr>
      </thead>
      <tbody>${violationRows}</tbody>
    </table>

    <footer>Generated by AccessFix v1.0 · ${new Date().toLocaleDateString()}</footer>
  </div>
</body>
</html>`;
  }

  private csv(value: string): string {
    const escaped = (value || '').replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private esc(value: string): string {
    return (value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
