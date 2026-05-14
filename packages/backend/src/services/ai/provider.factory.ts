// ============================================================
// AccessFix — AI Provider Factory
// Reads AI_PROVIDER from env and returns the correct provider.
// Add new providers here without touching any other code.
// ============================================================

import { AIProvider, AIProviderName, AIMessage, AIRequestOptions, AIRawResponse } from './ai.types';
import { OpenAIService } from './openai.service';
import { logger } from '../../utils/logger';

// ─── Claude Provider (stub — ready for API key) ───────────────

class ClaudeProvider implements AIProvider {
  readonly name: AIProviderName = 'claude';
  readonly isAvailable: boolean;

  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey     = process.env.ANTHROPIC_API_KEY  || '';
    this.model      = process.env.ANTHROPIC_MODEL    || 'claude-3-haiku-20240307';
    this.isAvailable = !!this.apiKey;
    if (!this.isAvailable) logger.warn('[Claude] ANTHROPIC_API_KEY not set');
  }

  async complete(messages: AIMessage[], options: AIRequestOptions = {}): Promise<AIRawResponse> {
    if (!this.isAvailable) throw new Error('Claude provider: ANTHROPIC_API_KEY not configured');

    const timeoutMs = options.timeoutMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: options.maxTokens ?? 1024,
          system: messages.find((m) => m.role === 'system')?.content,
          messages: messages.filter((m) => m.role !== 'system'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        content: data?.content?.[0]?.text || '',
        model: this.model,
        provider: 'claude',
        durationMs: Date.now() - startTime,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── LLaMA Provider (Ollama compatible) ──────────────────────

class LlamaProvider implements AIProvider {
  readonly name: AIProviderName = 'llama';
  readonly isAvailable: boolean;

  private readonly apiUrl: string;
  private readonly model: string;

  constructor() {
    this.apiUrl     = process.env.LLAMA_API_URL || 'http://localhost:11434';
    this.model      = process.env.LLAMA_MODEL   || 'llama3';
    this.isAvailable = !!this.apiUrl;
    if (this.isAvailable) logger.info(`[LLaMA] Provider configured at ${this.apiUrl}`);
  }

  async complete(messages: AIMessage[], options: AIRequestOptions = {}): Promise<AIRawResponse> {
    const timeoutMs = options.timeoutMs ?? 60000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          format: 'json',
        }),
      });

      if (!response.ok) throw new Error(`LLaMA HTTP ${response.status}`);

      const data = await response.json() as any;
      return {
        content: data?.message?.content || '',
        model: this.model,
        provider: 'llama',
        durationMs: Date.now() - startTime,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── No-op provider (AI disabled) ────────────────────────────

class NoneProvider implements AIProvider {
  readonly name: AIProviderName = 'none';
  readonly isAvailable = false;

  async complete(): Promise<AIRawResponse> {
    throw new Error('AI provider is set to "none". Set AI_PROVIDER in .env to enable AI suggestions.');
  }
}

// ─── Provider Factory ─────────────────────────────────────────

export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  /** Returns the configured singleton AI provider. */
  static getProvider(): AIProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /** Force a fresh provider (useful for testing). */
  static reset(): void {
    this.instance = null;
  }

  private static createProvider(): AIProvider {
    const providerName = (process.env.AI_PROVIDER || 'none').toLowerCase() as AIProviderName;
    logger.info(`[AIFactory] Initialising provider: "${providerName}"`);

    switch (providerName) {
      case 'openai': return new OpenAIService();
      case 'claude': return new ClaudeProvider();
      case 'llama':  return new LlamaProvider();
      default:
        logger.warn('[AIFactory] Unknown or disabled provider — using NoneProvider');
        return new NoneProvider();
    }
  }

  /** Returns a summary of the current provider state. */
  static getStatus(): { provider: string; isAvailable: boolean; model: string } {
    const p = this.getProvider();
    const modelMap: Record<AIProviderName, string> = {
      openai: process.env.OPENAI_MODEL    || 'gpt-4o-mini',
      claude: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      llama:  process.env.LLAMA_MODEL     || 'llama3',
      none:   'n/a',
    };
    return {
      provider: p.name,
      isAvailable: p.isAvailable,
      model: modelMap[p.name] || 'unknown',
    };
  }
}
