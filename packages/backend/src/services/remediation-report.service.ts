import { ScanResult, Violation, AIFixSuggestion } from '@accessfix/shared';
import { logger } from '../utils/logger';

export class RemediationReportService {
  /**
   * Generates a self-contained, professional, light-themed HTML remediation report.
   */
  generateRemediationReport(result: ScanResult, selectedViolations: Violation[], suggestions: AIFixSuggestion[]): string {
    logger.info(`[RemediationReport] Generating remediation report for scan ${result.scanId}`);

    const suggestionMap = new Map(suggestions.map(s => [s.ruleId, s]));
    
    // Calculate improved score (heuristic)
    const fixedCount = selectedViolations.length;
    const initialViolations = result.violations.length;
    const remainingViolations = Math.max(0, initialViolations - fixedCount);
    const improvement = initialViolations > 0 ? Math.round((fixedCount / initialViolations) * 100) : 0;
    
    const initialScore = result.score.overall;
    const estimatedNewScore = Math.min(100, initialScore + Math.round((100 - initialScore) * (fixedCount / (initialViolations || 1))));

    const rows = selectedViolations.map(v => {
      const fix = suggestionMap.get(v.ruleId);
      return this.renderViolationRow(v, fix);
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Remediation Report — ${this.esc(result.url)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --success: #16a34a;
      --warning: #ca8a04;
      --danger: #dc2626;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-300: #cbd5e1;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background: var(--slate-50); 
      color: var(--slate-800); 
      line-height: 1.5; 
      padding-bottom: 4rem;
    }
    
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    
    header { 
      background: white; 
      border: 1px solid var(--slate-200); 
      border-radius: 16px; 
      padding: 2.5rem; 
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }

    .badge-top {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      background: var(--slate-100);
      color: var(--slate-700);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    h1 { font-size: 2.25rem; font-weight: 800; color: var(--slate-900); margin-bottom: 0.75rem; letter-spacing: -0.02em; }
    .meta { color: var(--slate-600); font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .meta strong { color: var(--primary); font-family: 'JetBrains Mono', monospace; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .stat-card { 
      background: white; 
      border: 1px solid var(--slate-200); 
      border-radius: 12px; 
      padding: 1.5rem; 
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    .stat-label { color: var(--slate-600); font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 800; color: var(--slate-900); display: flex; align-items: baseline; gap: 0.5rem; }
    .stat-diff { font-size: 0.875rem; font-weight: 700; color: var(--success); }

    .section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--slate-900); display: flex; align-items: center; gap: 0.75rem; }
    
    .violation-card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    .violation-header {
      padding: 1.25rem 1.5rem;
      background: var(--slate-50);
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .violation-title { font-weight: 700; font-size: 1.125rem; }
    .violation-meta { display: flex; gap: 0.5rem; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .badge.critical { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge.major { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .badge.minor { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
    
    .violation-body { padding: 1.5rem; }
    .violation-desc { margin-bottom: 1.5rem; color: var(--slate-600); font-size: 0.95rem; }
    
    .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .code-box { border-radius: 8px; overflow: hidden; border: 1px solid var(--slate-200); }
    .code-label { 
      padding: 0.5rem 1rem; 
      font-size: 0.7rem; 
      font-weight: 700; 
      text-transform: uppercase; 
      display: flex; 
      align-items: center; 
      gap: 0.5rem;
      border-bottom: 1px solid var(--slate-200);
    }
    .label-before { background: #fee2e2; color: #991b1b; }
    .label-after { background: #dcfce7; color: #166534; }
    
    pre { 
      padding: 1rem; 
      background: white; 
      font-family: 'JetBrains Mono', monospace; 
      font-size: 0.8rem; 
      overflow-x: auto; 
      white-space: pre-wrap; 
      word-break: break-all;
      min-height: 80px;
    }
    
    .fix-explanation {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    .fix-explanation h4 { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #0369a1; margin-bottom: 0.5rem; }

    footer { text-align: center; color: var(--slate-500); font-size: 0.875rem; padding-top: 3rem; margin-top: 3rem; border-top: 1px solid var(--slate-200); }
    
    @media (max-width: 768px) {
      .comparison-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge-top">Remediation Report</div>
      <h1>Accessibility Remediation Summary</h1>
      <p class="meta">Target URL: <strong>${this.esc(result.url)}</strong></p>
      <p class="meta">Audit Date: ${new Date(result.scannedAt).toLocaleDateString()} · Generated: ${new Date().toLocaleDateString()}</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Initial Score</div>
        <div class="stat-value">${initialScore} <span style="font-size: 1rem; color: var(--slate-400); font-weight: 500;">/ 100</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Projected Score</div>
        <div class="stat-value">
          ${estimatedNewScore}
          <span class="stat-diff">↑ +${estimatedNewScore - initialScore}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Resolved Violations</div>
        <div class="stat-value">${fixedCount} <span style="font-size: 1rem; color: var(--slate-400); font-weight: 500;">of ${initialViolations}</span></div>
      </div>
    </div>

    <h2 class="section-title">Applied Accessibility Fixes</h2>
    <div class="violations-list">
      ${rows}
    </div>

    <footer>
      <p>Generated by <strong>AccessFix AI</strong> Remediation Engine</p>
      <p style="margin-top: 0.5rem;">&copy; ${new Date().getFullYear()} AccessFix. Professional Accessibility Auditing.</p>
    </footer>
  </div>
</body>
</html>`;
  }

  private renderViolationRow(v: Violation, fix?: AIFixSuggestion): string {
    return `
    <div class="violation-card">
      <div class="violation-header">
        <div class="violation-title">${this.esc(v.title)}</div>
        <div class="violation-meta">
          <span class="badge ${v.severity.toLowerCase()}">${v.severity}</span>
          <span class="badge" style="background: var(--slate-100); color: var(--slate-700);">${this.esc(v.wcag)}</span>
        </div>
      </div>
      <div class="violation-body">
        <div class="violation-desc">${this.esc(v.message)}</div>
        
        <div class="comparison-grid">
          <div class="code-box">
            <div class="code-label label-before">Original Snippet</div>
            <pre><code>${this.esc(v.htmlSnippet || '')}</code></pre>
          </div>
          <div class="code-box">
            <div class="code-label label-after">Accessible Fix</div>
            <pre><code>${this.esc(fix?.fixedHtml || v.htmlSnippet || '')}</code></pre>
          </div>
        </div>

        ${fix ? `
        <div class="fix-explanation">
          <h4>AI Remediation Strategy</h4>
          <p>${this.esc(fix.explanation)}</p>
          <div style="margin-top: 0.75rem; font-weight: 600; color: var(--success); display: flex; align-items: center; gap: 0.25rem;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
            ${this.esc(fix.accessibilityImpact)}
          </div>
        </div>
        ` : ''}
      </div>
    </div>`;
  }

  private esc(value: string): string {
    return (value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const remediationReportService = new RemediationReportService();
