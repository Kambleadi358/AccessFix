// ============================================================
// AccessFix — AI Prompt Builder
// Constructs precise, structured prompts for each violation type
// ============================================================

import { Violation, WCAGPrinciple } from '@accessfix/shared';

// ─── System prompt ────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a senior web accessibility engineer and WCAG 2.1/2.2 specialist.
Your role is to analyze accessibility violations in HTML code and provide precise, actionable remediation.

RULES:
1. Always return valid, parseable JSON — no markdown, no code fences, no extra text.
2. Keep fixedHtml minimal — only modify what is needed to fix the violation.
3. Preserve all existing attributes, ids, classes, and content unless they cause the violation.
4. Provide implementation steps that a developer can copy and apply immediately.
5. Be concise but technically accurate.
6. If the snippet is too short to produce a complete fix, provide the corrected element only.`;

// ─── Principle descriptions ───────────────────────────────────

const PRINCIPLE_CONTEXT: Record<WCAGPrinciple, string> = {
  Perceivable:    'Users must be able to perceive all information and UI components.',
  Operable:       'Users must be able to operate all UI components and navigation.',
  Understandable: 'Users must be able to understand information and UI operation.',
  Robust:         'Content must be robust enough to work with assistive technologies.',
};

// ─── JSON schema description injected into every prompt ───────

const RESPONSE_SCHEMA = `{
  "fixedHtml": "string — corrected HTML snippet",
  "explanation": "string — what was changed and why (1-3 sentences)",
  "accessibilityImpact": "string — how this helps users with disabilities (1-2 sentences)",
  "implementationSteps": ["string array — numbered steps to apply the fix"],
  "additionalGuidance": "string | null — optional best practice tip",
  "confidence": 0.95
}`;

// ─── Main prompt builders ─────────────────────────────────────

export class PromptBuilder {
  /**
   * Build a single-violation remediation prompt.
   * Injects rule ID, WCAG criterion, severity, HTML snippet, and fix guidance.
   */
  static buildRemediationPrompt(violation: Violation, htmlContext: string): string {
    const principleCtx = PRINCIPLE_CONTEXT[violation.principle] || '';

    return `## Accessibility Violation Remediation

### Violation Details
- **Rule ID**: ${violation.ruleId}
- **WCAG Criterion**: ${violation.wcag} (Level ${violation.level})
- **Principle**: ${violation.principle} — ${principleCtx}
- **Severity**: ${violation.severity}
- **Title**: ${violation.title}
- **Selector**: \`${violation.selector}\`
- **Issue**: ${violation.message}
- **Suggested Fix**: ${violation.howToFix}

### Violating HTML Element
\`\`\`html
${htmlContext || violation.htmlSnippet || '<!-- element not available -->'}
\`\`\`

### Your Task
Produce the minimal corrected HTML and an explanation.
Return ONLY valid JSON matching this exact schema (no markdown, no code fences):

${RESPONSE_SCHEMA}`;
  }

  /**
   * Build a WCAG explanation prompt for educational output.
   */
  static buildExplanationPrompt(violation: Violation): string {
    return `## WCAG Explanation Request

Explain this accessibility issue in simple terms for a developer who is new to accessibility.

- **Rule**: ${violation.title}
- **WCAG**: ${violation.wcag} (Level ${violation.level})
- **Principle**: ${violation.principle}

Return ONLY valid JSON:
{
  "simpleExplanation": "string — plain English explanation of the issue",
  "whyItMatters": "string — real-world impact on users with disabilities",
  "affectedUsers": ["array of user groups affected, e.g. screen reader users, keyboard-only users"],
  "legalImplications": "string — brief note on ADA/WCAG compliance relevance",
  "developerTip": "string — one concrete actionable tip"
}`;
  }

  /**
   * Build a batch triage prompt — summarizes multiple violations
   * and asks the model to prioritize them.
   */
  static buildBatchSummaryPrompt(violations: Violation[], pageUrl: string): string {
    const list = violations
      .slice(0, 10)
      .map((v, i) => `${i + 1}. [${v.severity}] ${v.ruleId} — ${v.title} (WCAG ${v.wcag})`)
      .join('\n');

    return `## Accessibility Audit Summary

Page URL: ${pageUrl}
Total Violations: ${violations.length}

### Violation List
${list}

### Your Task
Prioritize these violations and provide an executive summary.
Return ONLY valid JSON:
{
  "priorityOrder": ["ruleId strings in order from most to least critical"],
  "executiveSummary": "string — 2-3 sentence summary for a non-technical stakeholder",
  "quickWins": ["ruleId strings that are easiest/fastest to fix"],
  "estimatedFixTime": "string — rough estimate e.g. '2-4 hours'"
}`;
  }

  /**
   * Build a batch-violation remediation prompt for multiple violations.
   */
  static buildBatchRemediationPrompt(violations: Violation[]): string {
    const list = violations
      .map((v, i) => `--- VIOLATION ${i + 1} ---
Rule: ${v.ruleId} (${v.title})
Selector: ${v.selector}
Snippet: ${v.htmlSnippet || 'N/A'}`)
      .join('\n\n');

    return `## Batch Accessibility Remediation
You are fixing ${violations.length} violations in one go.

### Violations to Fix:
${list}

### Your Task
For each violation, provided the corrected HTML and an explanation.
Return ONLY valid JSON in an array format matching this schema:
[
  {
    "ruleId": "string",
    "originalHtml": "string",
    "fixedHtml": "string",
    "explanation": "string",
    "accessibilityImpact": "string",
    "implementationSteps": ["string"],
    "confidence": 0.95
  },
  ...
]`;
  }

  /**
   * Sanitise HTML before sending to AI — strips large content to save tokens.
   */
  static sanitiseHtmlSnippet(html: string, maxLength = 800): string {
    if (!html) return '';
    // Strip inline scripts and style blocks
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .trim();
    return cleaned.length > maxLength
      ? cleaned.slice(0, maxLength) + '... [truncated]'
      : cleaned;
  }
}
