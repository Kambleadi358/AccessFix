import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 1.3.1 / 3.3.2 – Form Labels (Level A)
 * Detects form inputs without associated labels.
 */
export const missingFormLabels: AccessibilityRule = {
  id: 'missing-form-labels',
  wcag: '1.3.1',
  level: 'A',
  principle: 'Perceivable',
  title: 'Missing Form Input Label',
  severity: 'Critical',
  tags: ['forms', 'labels', 'screen-reader', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const labelledIds = new Set<string>();

    // Collect all IDs that have an associated label
    $('label[for]').each((_i: number, el: any) => {
      const forAttr = $(el).attr('for');
      if (forAttr) labelledIds.add(forAttr);
    });

    const inputSelectors = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select';

    $(inputSelectors).each((_i: number, el: any) => {
      const $el = $(el);
      const id = $el.attr('id');
      const ariaLabel = $el.attr('aria-label');
      const ariaLabelledBy = $el.attr('aria-labelledby');
      const title = $el.attr('title');
      const placeholder = $el.attr('placeholder');
      const type = $el.attr('type') || 'text';

      // Check for various accessible name mechanisms
      const hasLabel = id && labelledIds.has(id);
      const hasAriaLabel = !!ariaLabel;
      const hasAriaLabelledBy = !!ariaLabelledBy;
      const hasTitle = !!title;

      // Placeholder alone is not sufficient (not a label replacement)
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
        const selector = id ? `#${id}` : `${el.tagName}[type="${type}"]`;
        violations.push(
          buildViolation(this, {
            selector,
            message: `Form ${el.tagName.toLowerCase()} (type="${type}") has no associated label. Screen reader users cannot identify the field's purpose.`,
            howToFix: `Add a <label> element with for="${id || 'input-id'}" or use aria-label="Field description". Placeholder text alone is not sufficient.`,
            fixable: true,
            htmlSnippet: $.html(el),
          })
        );
      }
    });

    return violations;
  },
};
