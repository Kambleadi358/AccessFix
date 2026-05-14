import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 2.4.3 (Level A) — Tabindex handling.
 * Catches positive tabindex (disrupts natural order) and 
 * non-interactive elements with interactive roles/attributes but no tabindex.
 */
export class TabindexRule implements AccessibilityRule {
  id = 'tabindex-handling';
  wcag = '2.4.3';
  level = 'A' as const;
  principle = 'Operable' as const;
  title = 'Tabindex Handling';
  severity = 'Major' as const;
  tags = ['keyboard', 'navigation'];

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];

    // 1. Positive tabindex (Major issue - breaks natural tab order)
    $('[tabindex]').each((_: number, el: any) => {
      const idx = parseInt($(el).attr('tabindex') || '0', 10);
      if (idx > 0) {
        violations.push(buildViolation(this, {
          selector: $(el).attr('id') ? `#${$(el).attr('id')}` : el.tagName,
          message: `Positive tabindex (${idx}) detected. This overrides the natural tab order and confuses keyboard users.`,
          howToFix: 'Remove positive tabindex and use correct DOM ordering or tabindex="0" / tabindex="-1".',
          htmlSnippet: $.html(el),
          fixable: true,
          fixConfidence: 0.9,
          severity: 'Major'
        }));
      }
    });

    // 2. Custom interactive elements missing tabindex (Critical issue)
    $('[role="button"], [role="link"], [role="checkbox"]').each((_: number, el: any) => {
      const tag = el.tagName.toLowerCase();
      const nativeInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tag);
      const hasTabindex = $(el).attr('tabindex') !== undefined;

      if (!nativeInteractive && !hasTabindex) {
        violations.push(buildViolation(this, {
          selector: $(el).attr('id') ? `#${$(el).attr('id')}` : el.tagName,
          message: `Element with role="${$(el).attr('role')}" is missing a tabindex. Keyboard users cannot reach this interactive element.`,
          howToFix: 'Add tabindex="0" to make this custom interactive element focusable.',
          htmlSnippet: $.html(el),
          fixable: true,
          fixConfidence: 1.0,
          severity: 'Critical'
        }));
      }
    });

    return violations;
  }
}
