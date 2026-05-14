import {
  AccessibilityScore,
  Violation,
  ViolationSeverity,
  WCAGPrinciple,
} from '@accessfix/shared';

interface ScoringConfig {
  criticalPenalty: number;
  majorPenalty: number;
  minorPenalty: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  criticalPenalty: parseInt(process.env.CRITICAL_PENALTY || '15', 10),
  majorPenalty: parseInt(process.env.MAJOR_PENALTY || '8', 10),
  minorPenalty: parseInt(process.env.MINOR_PENALTY || '3', 10),
};

const PRINCIPLES: WCAGPrinciple[] = [
  'Perceivable',
  'Operable',
  'Understandable',
  'Robust',
];

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Accessibility Scoring Engine
 *
 * Calculates a 0-100 score based on weighted violation severity.
 * Also produces per-POUR-principle sub-scores.
 */
export class ScoringEngine {
  private config: ScoringConfig;

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  calculate(violations: Violation[]): AccessibilityScore {
    const counts = {
      critical: violations.filter((v) => v.severity === 'Critical').length,
      major: violations.filter((v) => v.severity === 'Major').length,
      minor: violations.filter((v) => v.severity === 'Minor').length,
      total: violations.length,
    };

    // ── Overall score ─────────────────────────────────────
    const totalPenalty =
      counts.critical * this.config.criticalPenalty +
      counts.major * this.config.majorPenalty +
      counts.minor * this.config.minorPenalty;

    const overall = Math.max(0, Math.min(100, 100 - totalPenalty));

    // ── Per-principle scores ──────────────────────────────
    const byPrinciple = {} as Record<WCAGPrinciple, number>;

    PRINCIPLES.forEach((principle) => {
      const principleViolations = violations.filter((v) => v.principle === principle);
      const principlePenalty =
        principleViolations.filter((v) => v.severity === 'Critical').length * this.config.criticalPenalty +
        principleViolations.filter((v) => v.severity === 'Major').length * this.config.majorPenalty +
        principleViolations.filter((v) => v.severity === 'Minor').length * this.config.minorPenalty;

      byPrinciple[principle] = Math.max(0, Math.min(100, 100 - principlePenalty));
    });

    // ── Pass rate ─────────────────────────────────────────
    // Total rules = 10; passed = rules with zero violations
    const TOTAL_RULES = 10;
    const rulesWithViolations = new Set(violations.map((v) => v.ruleId)).size;
    const passRate = Math.round(((TOTAL_RULES - rulesWithViolations) / TOTAL_RULES) * 100);

    return {
      overall: Math.round(overall),
      byPrinciple,
      violationCounts: counts,
      grade: gradeFromScore(overall),
      passRate,
    };
  }
}

export const scoringEngine = new ScoringEngine();
