import { RemediationService } from '../services/ai/remediation.service';
import { Violation } from '@accessfix/shared';
import { AIProviderFactory } from '../services/ai/provider.factory';

// Mock the AI Provider to avoid real API calls
jest.mock('../services/ai/provider.factory', () => ({
  AIProviderFactory: {
    getProvider: jest.fn().mockReturnValue({
      name: 'mock-provider',
      complete: jest.fn().mockImplementation(async (messages: any[]) => {
        // Mock a batch response containing items for the chunk
        // The prompt builder logic will be tested implicitly by how many items we return
        const count = messages[1].content.match(/VIOLATION \d+/g).length;
        const results = Array(count).fill(0).map((_, i) => ({
          ruleId: `rule-${i}`, // Will be overridden in remediation service anyway
          originalHtml: '<div></div>',
          fixedHtml: '<div aria-label="fixed"></div>',
          explanation: 'Mock fix',
          accessibilityImpact: 'Better accessibility',
          implementationSteps: ['Step 1'],
          confidence: 0.95
        }));
        
        return {
          content: JSON.stringify(results),
          tokensUsed: 100,
          provider: 'mock-provider'
        };
      })
    })
  }
}));

describe('E2E Stress Test — AI Batching Logic', () => {
  let service: RemediationService;

  beforeEach(() => {
    service = new RemediationService();
    jest.clearAllMocks();
  });

  it('should process 100 violations in batches of 10 and return all suggestions', async () => {
    // 1. Create 100 mock violations
    const mockViolations: Violation[] = Array.from({ length: 100 }).map((_, i) => ({
      ruleId: `rule-${i}`,
      wcag: '1.1.1',
      level: 'A',
      principle: 'Perceivable',
      title: `Violation ${i}`,
      severity: 'Critical',
      selector: `.element-${i}`,
      message: `Issue ${i}`,
      howToFix: `Fix ${i}`,
      fixable: true,
      htmlSnippet: `<div class="element-${i}"></div>`
    }));

    // 2. Run batch remediation
    const results = await service.generateBatchFixes({
      violations: mockViolations,
      pageHtml: '<html></html>',
      pageUrl: 'https://example.com',
      maxViolations: 100 // Override default to allow the full stress test
    });

    // 3. Assertions
    expect(results).toHaveLength(100);
    
    // Check that we made exactly 10 calls to the provider (100 / 10 batch size)
    const provider = AIProviderFactory.getProvider();
    expect(provider.complete).toHaveBeenCalledTimes(10);

    // Verify all results have the expected structure
    results.forEach((s, i) => {
      expect(s.ruleId).toBeDefined();
      expect(s.fixedHtml).toContain('aria-label="fixed"');
    });

    console.log(`✅ Stress test passed: Processed ${results.length} violations across 10 batches.`);
  });
});
