import { AIFixSuggestion } from '@accessfix/shared';
import { createPatch } from 'diff';
import { logger } from '../utils/logger';

export interface CodePatch {
  ruleId: string;
  originalHtml: string;
  fixedHtml: string;
  diff: string; // Unified diff format
  patchPreview: string; // Contextual preview
}

/**
 * PatchService — The Core Fix Generation Engine.
 * Responsible for generating automated code-level patches and diffs.
 */
export class PatchService {
  /**
   * Generates a unified diff between original and fixed HTML.
   */
  generatePatch(suggestion: AIFixSuggestion): CodePatch {
    try {
      const { ruleId, originalHtml, fixedHtml } = suggestion;
      
      // Generate unified diff
      const patch = createPatch(
        `${ruleId}.html`,
        originalHtml,
        fixedHtml,
        'Original',
        'Fixed'
      );

      // Clean up patch — we only want the hunk, not the header for preview
      const patchPreview = patch
        .split('\n')
        .slice(4) // Skip header lines
        .join('\n');

      return {
        ruleId,
        originalHtml,
        fixedHtml,
        diff: patch,
        patchPreview
      };
    } catch (err: any) {
      logger.error('[PatchService] Failed to generate diff:', err.message);
      return {
        ruleId: suggestion.ruleId,
        originalHtml: suggestion.originalHtml,
        fixedHtml: suggestion.fixedHtml,
        diff: '',
        patchPreview: 'Diff generation failed.'
      };
    }
  }

  /**
   * Generates a batch of patches for multiple suggestions.
   */
  generateBatchPatches(suggestions: AIFixSuggestion[]): CodePatch[] {
    return suggestions.map(s => this.generatePatch(s));
  }
}

export const patchService = new PatchService();
