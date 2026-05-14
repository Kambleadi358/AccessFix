// ============================================================
// AccessFix — OpenAI Provider Implementation
// Uses process.env for API key — never hardcoded
// ============================================================

import {
  AIProvider, AIMessage, AIRequestOptions, AIRawResponse, AIProviderName
} from './ai.types';
import { logger } from '../../utils/logger';

/** Exponential back-off delay */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class OpenAIService implements AIProvider {
  readonly name: AIProviderName = 'openai';
  readonly isAvailable: boolean;

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey  = process.env.OPENAI_API_KEY  || '';
    this.model   = process.env.OPENAI_MODEL    || 'gpt-4o-mini';
    this.isAvailable = !!this.apiKey;

    if (!this.isAvailable) {
      logger.warn('[OpenAI] OPENAI_API_KEY not set — provider unavailable');
    } else {
      logger.info(`[OpenAI] Provider ready (model: ${this.model})`);
    }
  }

  // ─── Public: complete ───────────────────────────────────────

  async complete(
    messages: AIMessage[],
    options: AIRequestOptions = {}
  ): Promise<AIRawResponse> {
    if (!this.isAvailable) {
      throw new Error('OpenAI provider is not available — OPENAI_API_KEY not configured');
    }

    const maxRetries  = options.maxRetries    ?? parseInt(process.env.AI_MAX_RETRIES    || '3', 10);
    const retryDelay  = options.retryDelayMs  ?? parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10);
    const timeoutMs   = options.timeoutMs     ?? parseInt(process.env.AI_TIMEOUT_MS     || '30000', 10);
    const temperature = options.temperature   ?? 0.2;
    const maxTokens   = options.maxTokens     ?? 1024;

    let lastError: Error = new Error('No attempts made');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();

      try {
        logger.debug(`[OpenAI] Attempt ${attempt}/${maxRetries} — model: ${this.model}`);

        const content = await this.callWithTimeout(messages, temperature, maxTokens, timeoutMs);
        const durationMs = Date.now() - startTime;

        logger.debug(`[OpenAI] Response received in ${durationMs}ms`);

        return {
          content,
          model: this.model,
          provider: 'openai',
          durationMs,
        };
      } catch (err: any) {
        lastError = err;
        const isRetryable = this.isRetryableError(err);

        logger.warn(
          `[OpenAI] Attempt ${attempt} failed: ${err.message}` +
          (isRetryable && attempt < maxRetries ? ` — retrying in ${retryDelay * attempt}ms` : '')
        );

        if (!isRetryable || attempt === maxRetries) break;

        // Exponential back-off
        await sleep(retryDelay * attempt);
      }
    }

    throw new Error(`[OpenAI] All ${maxRetries} attempts failed. Last error: ${lastError.message}`);
  }

  // ─── Private helpers ────────────────────────────────────────

  private async callWithTimeout(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number,
    timeoutMs: number
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }, // enforce JSON mode
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const text = data?.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('OpenAI returned an empty response');
      }

      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  private isRetryableError(err: any): boolean {
    // Network errors, timeouts, and 429/500/503 are retryable
    if (err.name === 'AbortError') return true;
    const msg = err.message || '';
    return (
      msg.includes('HTTP 429') ||
      msg.includes('HTTP 500') ||
      msg.includes('HTTP 502') ||
      msg.includes('HTTP 503') ||
      msg.includes('fetch failed') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT')
    );
  }
}
