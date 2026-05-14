import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 2.4.2 – Page Titled (Level A)
 * Detects missing or empty <title> element.
 */
export const missingPageTitle: AccessibilityRule = {
  id: 'missing-page-title',
  wcag: '2.4.2',
  level: 'A',
  principle: 'Operable',
  title: 'Missing Page Title',
  severity: 'Major',
  tags: ['navigation', 'title', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const title = $('title').first().text().trim();

    if (!title) {
      return [
        buildViolation(this, {
          selector: 'head > title',
          message: 'The page is missing a descriptive <title> element or the title is empty.',
          howToFix: 'Add a meaningful <title> inside <head>: <title>Page Name — Site Name</title>',
          fixable: true,
          htmlSnippet: '<title></title>',
          fixConfidence: 0.8,
        }),
      ];
    }

    return [];
  },
};

/**
 * WCAG 3.1.1 – Language of Page (Level A)
 * Detects missing or invalid lang attribute on <html>.
 */
export const missingHtmlLang: AccessibilityRule = {
  id: 'missing-html-lang',
  wcag: '3.1.1',
  level: 'A',
  principle: 'Understandable',
  title: 'Missing HTML Language Attribute',
  severity: 'Major',
  tags: ['language', 'screen-reader', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const lang = $('html').attr('lang');

    if (!lang || lang.trim() === '') {
      return [
        buildViolation(this, {
          selector: 'html',
          message: 'The <html> element is missing a lang attribute. Screen readers rely on this to use the correct language profile.',
          howToFix: 'Add a valid BCP 47 language tag: <html lang="en">',
          fixable: true,
          htmlSnippet: '<html>',
          fixConfidence: 1.0,
        }),
      ];
    }

    return [];
  },
};
