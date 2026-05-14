import { AccessibilityRule, RuleContext, buildViolation } from './base.rule';
import { Violation } from '@accessfix/shared';

/**
 * WCAG 4.1.1 – Parsing (Level A)
 * Detects duplicate IDs in the DOM.
 */
export const duplicateIds: AccessibilityRule = {
  id: 'duplicate-ids',
  wcag: '4.1.1',
  level: 'A',
  principle: 'Robust',
  title: 'Duplicate Element IDs',
  severity: 'Major',
  tags: ['html', 'parsing', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const idCounts = new Map<string, number>();

    $('[id]').each((_i, el) => {
      const id = $(el).attr('id');
      if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
    });

    idCounts.forEach((count, id) => {
      if (count > 1) {
        violations.push(
          buildViolation(this, {
            selector: `#${id}`,
            message: `The ID "${id}" appears ${count} times. IDs must be unique; duplicate IDs break aria-labelledby/describedby and form associations.`,
            howToFix: `Make each ID unique. Change subsequent elements with id="${id}" to unique identifiers like id="${id}-2".`,
            fixable: false,
          })
        );
      }
    });

    return violations;
  },
};

/**
 * WCAG 4.1.2 – Name, Role, Value (Level A)
 * Detects elements using ARIA roles that are missing required attributes.
 */
export const missingAriaAttributes: AccessibilityRule = {
  id: 'missing-aria-attributes',
  wcag: '4.1.2',
  level: 'A',
  principle: 'Robust',
  title: 'Missing Required ARIA Attributes',
  severity: 'Major',
  tags: ['aria', 'screen-reader', 'wcag-a'],

  evaluate({ $ }: RuleContext): Violation[] {
    const violations: Violation[] = [];

    // Required attributes per role
    const roleRequirements: Record<string, string[]> = {
      checkbox: ['aria-checked'],
      combobox: ['aria-expanded'],
      listbox: [],
      option: ['aria-selected'],
      radio: ['aria-checked'],
      slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      scrollbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-controls'],
      spinbutton: ['aria-valuenow'],
      progressbar: [],
      tab: ['aria-selected'],
      tabpanel: [],
    };

    Object.entries(roleRequirements).forEach(([role, requiredAttrs]) => {
      $(`[role="${role}"]`).each((_i, el) => {
        const $el = $(el);
        const missing: string[] = [];

        requiredAttrs.forEach((attr) => {
          if (!$el.attr(attr)) missing.push(attr);
        });

        if (missing.length > 0) {
          const selector = $el.attr('id') ? `#${$el.attr('id')}` : `[role="${role}"]`;
          violations.push(
            buildViolation(this, {
              selector,
              message: `Element with role="${role}" is missing required ARIA attribute(s): ${missing.join(', ')}.`,
              howToFix: `Add the missing attributes: ${missing.map((a) => `${a}="value"`).join(', ')}`,
              fixable: false,
              htmlSnippet: $.html(el),
            })
          );
        }
      });
    });

    return violations;
  },
};
