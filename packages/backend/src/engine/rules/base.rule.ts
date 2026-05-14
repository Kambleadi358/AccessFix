import * as cheerio from 'cheerio';
import { Violation, WCAGLevel, WCAGPrinciple, ViolationSeverity } from '@accessfix/shared';

// ─── Base interface every rule must implement ─────────────────

export interface RuleContext {
  /** Cheerio root for DOM querying */
  $: cheerio.CheerioAPI;
  /** Full HTML string of the page */
  html: string;
  /** URL of the scanned page */
  url: string;
}

export interface AccessibilityRule {
  /** Unique stable identifier */
  id: string;
  /** WCAG success criterion */
  wcag: string;
  /** Conformance level */
  level: WCAGLevel;
  /** POUR principle */
  principle: WCAGPrinciple;
  /** Human-readable title */
  title: string;
  /** Default severity */
  severity: ViolationSeverity;
  /** Tags for filtering */
  tags: string[];
  /**
   * Execute the rule against the DOM.
   * Returns an array of Violation objects (empty = pass).
   */
  evaluate(ctx: RuleContext): Violation[];
}

export function buildViolation(
  rule: AccessibilityRule,
  overrides: Partial<Violation> & Pick<Violation, 'selector' | 'message' | 'howToFix'>
): Violation {
  return {
    ruleId: rule.id,
    wcag: rule.wcag,
    level: rule.level,
    principle: rule.principle,
    title: rule.title,
    severity: rule.severity,
    fixable: false,
    fixConfidence: 0,
    htmlSnippet: '',
    ...overrides,
  };
}
