import { AccessibilityRule, RuleContext } from './rules/base.rule';
import { Violation } from '@accessfix/shared';
import { missingAltText } from './rules/missing-alt-text.rule';
import { missingFormLabels } from './rules/missing-form-labels.rule';
import { missingPageTitle, missingHtmlLang } from './rules/page-meta.rule';
import { headingHierarchy } from './rules/heading-hierarchy.rule';
import { missingButtonName, missingSkipNav } from './rules/interactive-elements.rule';
import { duplicateIds, missingAriaAttributes } from './rules/dom-structure.rule';
import { colorContrast } from './rules/color-contrast.rule';
import { AltNuanceRule } from './rules/alt-nuance.rule';
import { TabindexRule } from './rules/tabindex.rule';
import { logger } from '../utils/logger';

// ─── Registry ─────────────────────────────────────────────────

const ALL_RULES: AccessibilityRule[] = [
  missingAltText,
  missingFormLabels,
  missingPageTitle,
  missingHtmlLang,
  headingHierarchy,
  missingButtonName,
  missingSkipNav,
  duplicateIds,
  missingAriaAttributes,
  colorContrast,
  new AltNuanceRule(),
  new TabindexRule(),
];

export class RuleEngine {
  private rules: AccessibilityRule[];

  constructor(skipRules: string[] = []) {
    this.rules = ALL_RULES.filter((r) => !skipRules.includes(r.id));
    logger.info(`WCAG Rule Engine loaded ${this.rules.length} rules`);
  }

  /**
   * Run all rules against the provided DOM context.
   * Returns a flat array of all violations found.
   */
  run(ctx: RuleContext): Violation[] {
    const allViolations: Violation[] = [];

    for (const rule of this.rules) {
      try {
        const violations = rule.evaluate(ctx);
        allViolations.push(...violations);

        if (violations.length > 0) {
          logger.debug(`[${rule.id}] → ${violations.length} violation(s)`);
        }
      } catch (err) {
        logger.warn(`Rule "${rule.id}" threw an error:`, err);
      }
    }

    logger.info(`Rule engine completed: ${allViolations.length} total violation(s)`);
    return allViolations;
  }

  /** Returns metadata for all registered rules */
  getRuleMetadata() {
    return this.rules.map(({ id, wcag, level, principle, title, severity, tags }) => ({
      id,
      wcag,
      level,
      principle,
      title,
      severity,
      tags,
    }));
  }
}
