import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 1.1.1 – Non-text Content (Level A)
 * Detects images that are missing an alt attribute.
 */
export const missingAltText: AccessibilityRule = {
  id: 'missing-alt-text',
  wcag: '1.1.1',
  level: 'A',
  principle: 'Perceivable',
  title: 'Missing Alt Text on Image',
  severity: 'Critical',
  tags: ['images', 'screen-reader', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];

    $('img').each((_i: number, el: any) => {
      const $el = $(el);
      const alt = $el.attr('alt');
      const role = $el.attr('role');
      const ariaLabel = $el.attr('aria-label');
      const ariaLabelledBy = $el.attr('aria-labelledby');

      // Decorative images with role="presentation" or role="none" are exempt
      if (role === 'presentation' || role === 'none') return;
      // Images with aria-label / aria-labelledby are acceptable
      if (ariaLabel || ariaLabelledBy) return;
      // Missing alt entirely OR empty alt on non-decorative image
      if (alt === undefined) {
        const src = $el.attr('src') || 'unknown';
        const selector = `img[src="${src}"]`;

        violations.push(
          buildViolation(this, {
            selector,
            message: `Image with src="${src}" is missing an alt attribute. Screen readers cannot convey the image's purpose.`,
            howToFix: `Add a descriptive alt attribute: <img src="${src}" alt="Description of image">. For decorative images use alt="".`,
            fixable: true,
            htmlSnippet: $.html(el),
            fixConfidence: 0.9,
          })
        );
      }
    });

    return violations;
  },
};
