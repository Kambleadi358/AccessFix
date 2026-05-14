// ============================================================
// AccessFix — AI Engine (refactored)
// Now delegates to the modular /services/ai/ architecture.
// This file is kept as the public interface used by scan.orchestrator
// ============================================================

import { AIFixSuggestion, Violation } from '@accessfix/shared';
import { remediationService } from '../services/ai/remediation.service';
import { AIProviderFactory } from '../services/ai/provider.factory';
import { logger } from '../utils/logger';

export class AIEngine {
  /**
   * Generate fix suggestions for fixable violations.
   * Delegates to RemediationService which calls the active AI provider.
   *
   * Returns AIFixSuggestion[] compatible with ScanResult schema.
   */
  async generateSuggestions(
    violations: Violation[],
    pageUrl = '',
    pageHtml = ''
  ): Promise<AIFixSuggestion[]> {
    const status = AIProviderFactory.getStatus();

    if (!status.isAvailable) {
      logger.info('[AIEngine] Provider unavailable — skipping AI suggestions');
      return [];
    }

    logger.info(
      `[AIEngine] Generating suggestions via ${status.provider} (${status.model})`
    );

    try {
      const suggestions = await remediationService.generateBatchFixes({
        violations,
        pageHtml,
        pageUrl,
        maxViolations: 20,
      });

      // Map to shared AIFixSuggestion schema
      return suggestions.map((s): AIFixSuggestion => ({
        ruleId:              s.ruleId,
        originalHtml:        s.originalHtml,
        fixedHtml:           s.fixedHtml,
        explanation:         s.explanation,
        accessibilityImpact: s.accessibilityImpact,
        confidence:          s.confidence,
      }));
    } catch (err: any) {
      logger.error('[AIEngine] Batch generation failed:', err.message);
      return [];
    }
  }

  /** Expose provider status for the /api/ai/status endpoint */
  getProviderStatus() {
    return AIProviderFactory.getStatus();
  }
}

export const aiEngine = new AIEngine();
