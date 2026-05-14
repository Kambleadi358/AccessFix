import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 1.1.1 (Level A) — Empty alt on informational images.
 * This rule catches <img> tags that have alt="" but are likely informational 
 * (e.g. have a src that looks meaningful, or are within a link).
 */
export class AltNuanceRule implements AccessibilityRule {
  id = 'empty-alt-informational';
  wcag = '1.1.1';
  level = 'A' as const;
  principle = 'Perceivable' as const;
  title = 'Empty alt on informational image';
  severity = 'Major' as const;
  tags = ['image', 'text-alternative'];

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];

    $('img').each((_: number, el: any) => {
      const img = $(el);
      const alt = img.attr('alt');
      const src = img.attr('src') || '';
      
      // We are looking for alt="" (explicitly empty)
      if (alt === '') {
        // Nuance: If image is inside an <a>, it MUST have an alt or the link has no name
        const isInsideLink = img.closest('a').length > 0;
        
        // Nuance: If filename looks like it contains data (not just 'icon', 'pixel', 'spacer')
        const fileName = src.split('/').pop()?.toLowerCase() || '';
        const isLikelyInfo = !/spacer|pixel|invisible|dot|bg|line|border|shadow/i.test(fileName) && fileName.length > 5;

        if (isInsideLink || isLikelyInfo) {
          violations.push(buildViolation(this, {
            selector: img.attr('id') ? `#${img.attr('id')}` : 'img', // Simplistic selector
            message: isInsideLink 
              ? 'Image with empty alt is inside a link. This makes the link inaccessible to screen readers.' 
              : 'Image has empty alt but appears to be informational based on its filename.',
            howToFix: 'Provide a descriptive alt attribute for informational images. If decorative, verify it is correctly ignored.',
            htmlSnippet: $.html(el),
            fixable: true,
            fixConfidence: 0.8
          }));
        }
      }
    });

    return violations;
  }
}
