import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';
import * as cheerio from 'cheerio';

/**
 * WCAG 1.3.1 – Info and Relationships (Level A)
 * Detects incorrect heading hierarchy (skipped levels).
 */
export const headingHierarchy: AccessibilityRule = {
  id: 'heading-hierarchy',
  wcag: '1.3.1',
  level: 'A',
  principle: 'Perceivable',
  title: 'Incorrect Heading Hierarchy',
  severity: 'Major',
  tags: ['headings', 'structure', 'screen-reader', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const headings: Array<{ level: number; text: string; el: any }> = [];

    $('h1, h2, h3, h4, h5, h6').each((_i, el) => {
      const level = parseInt(el.tagName.replace('h', ''), 10);
      const text = $(el).text().trim().slice(0, 80);
      headings.push({ level, text, el });
    });

    // Check: no h1
    if (headings.length > 0 && !headings.some((h) => h.level === 1)) {
      violations.push(
        buildViolation(this, {
          selector: 'body',
          message: 'Page has no <h1> element. Every page should have exactly one <h1> as the main heading.',
          howToFix: 'Add an <h1> element that describes the main topic of the page.',
          fixable: false,
        })
      );
    }

    // Check for level skips (e.g. h1 → h3)
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];
      if (curr.level > prev.level + 1) {
        violations.push(
          buildViolation(this, {
            selector: curr.el.tagName,
            message: `Heading level skipped from <h${prev.level}> to <h${curr.level}> ("${curr.text}"). This breaks the document outline for screen reader users.`,
            howToFix: `Change <h${curr.level}> to <h${prev.level + 1}> to maintain consistent heading hierarchy.`,
            fixable: true,
            htmlSnippet: $.html(curr.el),
          })
        );
      }
    }

    return violations;
  },
};
