// ============================================================
// AccessFix — AI Service Type Definitions
// Shared across all AI providers and the remediation pipeline
// ============================================================

import { Violation, WCAGPrinciple } from '@accessfix/shared';

// ─── Provider Enum ────────────────────────────────────────────

export type AIProviderName = 'openai' | 'claude' | 'llama' | 'none';

// ─── Raw AI request/response ──────────────────────────────────

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  /** Max milliseconds before aborting the request */
  timeoutMs?: number;
  /** Maximum number of retry attempts on transient failure */
  maxRetries?: number;
  /** Delay in ms between retries (doubles on each attempt) */
  retryDelayMs?: number;
  /** Temperature (creativity) 0.0–1.0 */
  temperature?: number;
  /** Max tokens in completion */
  maxTokens?: number;
}

export interface AIRawResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  provider: AIProviderName;
  durationMs: number;
}

// ─── Structured Remediation Response ─────────────────────────

export interface RemediationSuggestion {
  /** Rule this suggestion addresses */
  ruleId: string;

  /** WCAG criterion reference */
  wcag: string;

  /** Principle category */
  principle: WCAGPrinciple;

  /** The original violating HTML snippet */
  originalHtml: string;

  /** Corrected HTML snippet after applying fix */
  fixedHtml: string;

  /** Developer-friendly explanation of what changed and why */
  explanation: string;

  /** How the fix improves the experience for users with disabilities */
  accessibilityImpact: string;

  /** Steps a developer should take to apply the fix */
  implementationSteps: string[];

  /** Additional best practice guidance */
  additionalGuidance?: string;

  /** Model confidence in fix quality 0–1 */
  confidence: number;

  /** Which AI provider generated this */
  provider: AIProviderName;

  /** Token cost (optional, for tracking) */
  tokensUsed?: number;
}

// ─── Batch Remediation Request ────────────────────────────────

export interface RemediationRequest {
  violation: Violation;
  htmlContext: string;
  pageUrl: string;
  options?: AIRequestOptions;
}

export interface BatchRemediationRequest {
  violations: Violation[];
  pageHtml: string;
  pageUrl: string;
  /** Max violations to process (prevents excessive API cost) */
  maxViolations?: number;
  options?: AIRequestOptions;
}

// ─── WCAG Explanation Response ────────────────────────────────

export interface WcagExplanation {
  ruleId: string;
  wcag: string;
  simpleExplanation: string;
  whyItMatters: string;
  affectedUsers: string[];
  legalImplications: string;
}

// ─── Provider Interface ───────────────────────────────────────

export interface AIProvider {
  readonly name: AIProviderName;
  readonly isAvailable: boolean;

  /**
   * Send a chat completion request.
   * Returns the raw text content from the model.
   */
  complete(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): Promise<AIRawResponse>;
}

// ─── Config loaded from env ───────────────────────────────────

export interface AIConfig {
  provider: AIProviderName;
  openai: {
    apiKey: string;
    model: string;
  };
  claude: {
    apiKey: string;
    model: string;
  };
  llama: {
    apiUrl: string;
    model: string;
  };
  defaults: AIRequestOptions;
}
