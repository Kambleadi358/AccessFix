import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 4.1.2 – Name, Role, Value (Level A)
 * Detects buttons without accessible names.
 */
export const missingButtonName: AccessibilityRule = {
  id: 'missing-button-name',
  wcag: '4.1.2',
  level: 'A',
  principle: 'Robust',
  title: 'Missing Button Accessible Name',
  severity: 'Critical',
  tags: ['buttons', 'interactive', 'screen-reader', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];

    $('button, [role="button"]').each((_i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const ariaLabel = $el.attr('aria-label');
      const ariaLabelledBy = $el.attr('aria-labelledby');
      const title = $el.attr('title');
      const value = $el.attr('value');

      // Check for any accessible name source
      const hasAccessibleName = text || ariaLabel || ariaLabelledBy || title || value;

      if (!hasAccessibleName) {
        const selector = $el.attr('id')
          ? `#${$el.attr('id')}`
          : `button`;

        violations.push(
          buildViolation(this, {
            selector,
            message: 'Button has no accessible name. Screen reader users cannot determine its purpose.',
            howToFix: 'Add descriptive text content, or use aria-label="Action description" on the button element.',
            fixable: true,
            htmlSnippet: $.html(el),
          })
        );
      }
    });

    return violations;
  },
};

/**
 * WCAG 2.4.1 – Bypass Blocks (Level A)
 * Detects missing skip navigation link.
 */
export const missingSkipNav: AccessibilityRule = {
  id: 'missing-skip-nav',
  wcag: '2.4.1',
  level: 'A',
  principle: 'Operable',
  title: 'Missing Skip Navigation Link',
  severity: 'Major',
  tags: ['navigation', 'keyboard', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    // Look for common skip nav patterns
    const skipPatterns = [
      'a[href="#main"]',
      'a[href="#content"]',
      'a[href="#main-content"]',
      '.skip-nav',
      '.skip-link',
      '[class*="skip"]',
    ];

    const hasSkipNav = skipPatterns.some((sel) => $(sel).length > 0);

    if (!hasSkipNav) {
      return [
        buildViolation(this, {
          selector: 'body > :first-child',
          message: 'Page is missing a skip navigation link. Keyboard users must tab through all navigation links to reach the main content.',
          howToFix: `Add as the very first element in <body>:
<a href="#main-content" class="skip-link">Skip to main content</a>
And add id="main-content" to your main content wrapper.`,
          fixable: true,
        }),
      ];
    }

    return [];
  },
};
