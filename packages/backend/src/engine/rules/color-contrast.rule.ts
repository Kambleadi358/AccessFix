import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 1.4.3 – Contrast (Minimum) (Level AA)
 * Heuristic detection based on inline styles.
 * Note: Full contrast analysis requires computed styles from Puppeteer.
 */
export const colorContrast: AccessibilityRule = {
  id: 'color-contrast',
  wcag: '1.4.3',
  level: 'AA',
  principle: 'Perceivable',
  title: 'Insufficient Color Contrast',
  severity: 'Major',
  tags: ['color', 'contrast', 'visual', 'wcag-aa'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];

    // Known low-contrast color pairs (heuristic)
    const problematicPairs = [
      { fg: '#999', bg: '#fff', label: 'grey on white' },
      { fg: '#aaa', bg: '#fff', label: 'light grey on white' },
      { fg: '#ccc', bg: '#fff', label: 'very light grey on white' },
      { fg: '#fff', bg: '#fff', label: 'white on white' },
      { fg: '#000', bg: '#000', label: 'black on black' },
      { fg: '#888', bg: '#eee', label: 'medium grey on light grey' },
      { fg: 'gray', bg: 'white', label: 'gray on white' },
      { fg: 'lightgray', bg: 'white', label: 'lightgray on white' },
    ];

    $('[style]').each((_i: number, el: any) => {
      const style = $(el).attr('style') || '';
      const text = $(el).text().trim();

      if (!text) return; // no text, skip

      // Extract color and background-color from inline styles
      const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      const bgMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);

      if (colorMatch && bgMatch) {
        const fg = colorMatch[1].trim().toLowerCase();
        const bg = bgMatch[1].trim().toLowerCase();

        const isPair = problematicPairs.some(
          (p) =>
            (fg.includes(p.fg) && bg.includes(p.bg)) ||
            (fg.includes(p.bg) && bg.includes(p.fg))
        );

        if (isPair) {
          const selector = $(el).attr('id') ? `#${$(el).attr('id')}` : el.tagName;
          violations.push(
            buildViolation(this, {
              selector,
              message: `Text "${text.slice(0, 40)}" may have insufficient color contrast (color: ${fg}, background: ${bg}). Minimum ratio is 4.5:1 for normal text, 3:1 for large text.`,
              howToFix: `Use colors with a contrast ratio of at least 4.5:1. Use tools like WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/) to verify.`,
              fixable: false,
              htmlSnippet: $.html(el),
            })
          );
        }
      }
    });

    return violations;
  },
};
