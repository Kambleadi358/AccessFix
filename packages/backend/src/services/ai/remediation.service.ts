// ============================================================
// AccessFix — Remediation Service
// Core pipeline: Violation → Prompt → AI → Structured Fix
// ============================================================

import { Violation } from '@accessfix/shared';
import {
  RemediationSuggestion,
  RemediationRequest,
  BatchRemediationRequest,
  WcagExplanation,
  AIRequestOptions,
} from './ai.types';
import { AIProviderFactory } from './provider.factory';
import { PromptBuilder, SYSTEM_PROMPT } from './prompt.builder';
import { logger } from '../../utils/logger';

const AI_BATCH_SIZE = 10;

export class RemediationService {
  // ─── Single violation fix ─────────────────────────────────

  async generateFix(req: RemediationRequest): Promise<RemediationSuggestion> {
    const { violation, htmlContext, pageUrl, options } = req;
    const provider = AIProviderFactory.getProvider();

    logger.info(`[Remediation] Generating fix for rule: ${violation.ruleId}`);

    const safeSnippet = PromptBuilder.sanitiseHtmlSnippet(
      htmlContext || violation.htmlSnippet || ''
    );

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user'   as const, content: PromptBuilder.buildRemediationPrompt(violation, safeSnippet) },
    ];

    const startTime = Date.now();
    const raw = await provider.complete(messages, this.mergeOptions(options));
    const durationMs = Date.now() - startTime;

    const parsed = this.parseRemediationResponse(raw.content, violation, safeSnippet);

    logger.info(
      `[Remediation] Fix generated for ${violation.ruleId} via ${provider.name} ` +
      `in ${durationMs}ms (confidence: ${parsed.confidence})`
    );

    return {
      ...parsed,
      ruleId:    violation.ruleId,
      wcag:      violation.wcag,
      principle: violation.principle,
      provider:  provider.name,
      tokensUsed: raw.tokensUsed,
    };
  }

  // ─── Batch processing with chunking ───────────────────────

  async generateBatchFixes(req: BatchRemediationRequest): Promise<RemediationSuggestion[]> {
    const {
      violations,
      pageHtml,
      pageUrl,
      maxViolations = 20,
      options,
    } = req;

    // Prioritise: Critical first, then Major, then fixable items only
    const prioritised = violations
      .filter((v) => v.fixable && v.htmlSnippet)
      .sort((a, b) => {
        const severityOrder = { Critical: 0, Major: 1, Minor: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, maxViolations);

    if (prioritised.length === 0) return [];

    logger.info(
      `[Remediation] Batch: ${prioritised.length} violations to fix ` +
      `(from ${violations.length} total), chunk size: ${AI_BATCH_SIZE}`
    );

    const results: RemediationSuggestion[] = [];
    const chunks: Violation[][] = [];

    for (let i = 0; i < prioritised.length; i += AI_BATCH_SIZE) {
      chunks.push(prioritised.slice(i, i + AI_BATCH_SIZE));
    }

    const provider = AIProviderFactory.getProvider();

    for (const chunk of chunks) {
      try {
        logger.info(`[Remediation] Processing chunk of ${chunk.length} violations...`);
        
        const messages = [
          { role: 'system' as const, content: SYSTEM_PROMPT },
          { role: 'user'   as const, content: PromptBuilder.buildBatchRemediationPrompt(chunk) },
        ];

        const raw = await provider.complete(messages, this.mergeOptions(options));
        const parsedArray = this.safeParseJSON(raw.content, []);

        if (Array.isArray(parsedArray)) {
          results.push(...parsedArray.map(s => ({
            ...s,
            provider: provider.name,
            tokensUsed: raw.tokensUsed ? Math.floor(raw.tokensUsed / chunk.length) : 0,
            wcag: chunk.find(v => v.ruleId === s.ruleId)?.wcag || '',
            principle: chunk.find(v => v.ruleId === s.ruleId)?.principle || 'Perceivable'
          })));
        }
      } catch (err: any) {
        logger.warn(`[Remediation] Chunk processing failed: ${err.message}. Falling back to individual calls.`);
        // Fallback to individual calls for this chunk
        for (const v of chunk) {
          try {
            results.push(await this.generateFix({ 
              violation: v, 
              pageUrl, 
              options,
              htmlContext: v.htmlSnippet || '' 
            }));
          } catch (innerErr) {
            results.push(this.buildFallbackSuggestion(v));
          }
        }
      }
    }

    return results;
  }

  // ─── WCAG explanation ─────────────────────────────────────

  async explainViolation(violation: Violation, options?: AIRequestOptions): Promise<WcagExplanation> {
    const provider = AIProviderFactory.getProvider();

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user'   as const, content: PromptBuilder.buildExplanationPrompt(violation) },
    ];

    const raw = await provider.complete(messages, this.mergeOptions(options));
    return this.parseExplanationResponse(raw.content, violation);
  }

  // ─── Batch summary / prioritisation ──────────────────────

  async summariseViolations(
    violations: Violation[],
    pageUrl: string,
    options?: AIRequestOptions
  ) {
    const provider = AIProviderFactory.getProvider();

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user'   as const, content: PromptBuilder.buildBatchSummaryPrompt(violations, pageUrl) },
    ];

    const raw = await provider.complete(messages, this.mergeOptions(options));
    return this.safeParseJSON(raw.content, {});
  }

  // ─── Private helpers ──────────────────────────────────────

  private mergeOptions(options?: AIRequestOptions): AIRequestOptions {
    return {
      timeoutMs:    parseInt(process.env.AI_TIMEOUT_MS     || '30000', 10),
      maxRetries:   parseInt(process.env.AI_MAX_RETRIES    || '3', 10),
      retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
      temperature:  0.2,
      maxTokens:    1024,
      ...options,
    };
  }

  private parseRemediationResponse(
    raw: string,
    violation: Violation,
    originalHtml: string
  ): Omit<RemediationSuggestion, 'ruleId' | 'wcag' | 'principle' | 'provider'> {
    const parsed = this.safeParseJSON(raw, {});

    return {
      originalHtml,
      fixedHtml:            parsed.fixedHtml           || originalHtml,
      explanation:          parsed.explanation          || violation.howToFix,
      accessibilityImpact:  parsed.accessibilityImpact  || 'Improves accessibility for users with disabilities.',
      implementationSteps:  Array.isArray(parsed.implementationSteps)
                              ? parsed.implementationSteps
                              : [violation.howToFix],
      additionalGuidance:   parsed.additionalGuidance   || undefined,
      confidence:           typeof parsed.confidence === 'number'
                              ? Math.min(1, Math.max(0, parsed.confidence))
                              : 0.75,
    };
  }

  private parseExplanationResponse(raw: string, violation: Violation): WcagExplanation {
    const parsed = this.safeParseJSON(raw, {});
    return {
      ruleId:             violation.ruleId,
      wcag:               violation.wcag,
      simpleExplanation:  parsed.simpleExplanation  || violation.message,
      whyItMatters:       parsed.whyItMatters       || 'Affects users who rely on assistive technologies.',
      affectedUsers:      Array.isArray(parsed.affectedUsers) ? parsed.affectedUsers : ['Screen reader users'],
      legalImplications:  parsed.legalImplications  || 'May affect WCAG 2.1 compliance.',
    };
  }

  private safeParseJSON(raw: string, fallback: any): any {
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleaned);
    } catch {
      logger.warn('[Remediation] AI response was not valid JSON — using fallback');
      return fallback;
    }
  }

  /** Rule-based fallback when AI call fails */
  private buildFallbackSuggestion(violation: Violation): RemediationSuggestion {
    return {
      ruleId:              violation.ruleId,
      wcag:                violation.wcag,
      principle:           violation.principle,
      originalHtml:        violation.htmlSnippet || '',
      fixedHtml:           violation.htmlSnippet || '',
      explanation:         violation.howToFix,
      accessibilityImpact: 'Improves accessibility for users with disabilities.',
      implementationSteps: [violation.howToFix],
      confidence:          0.5,
      provider:            'none',
    };
  }
}

// Singleton export
export const remediationService = new RemediationService();
