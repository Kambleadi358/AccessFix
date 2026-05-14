import { ScoringEngine } from '../engine/scoring.engine';
import { Violation } from '@accessfix/shared';

describe('ScoringEngine', () => {
  const engine = new ScoringEngine({
    criticalPenalty: 15,
    majorPenalty: 8,
    minorPenalty: 3,
  });

  it('should return 100 for zero violations', () => {
    const score = engine.calculate([]);
    expect(score.overall).toBe(100);
    expect(score.grade).toBe('A');
  });

  it('should calculate correct deductions based on severity', () => {
    const violations: Partial<Violation>[] = [
      { severity: 'Critical', principle: 'Perceivable' },
      { severity: 'Major', principle: 'Operable' },
      { severity: 'Minor', principle: 'Robust' },
    ];

    const score = engine.calculate(violations as Violation[]);
    
    // 100 - (15 + 8 + 3) = 74
    expect(score.overall).toBe(74);
    expect(score.grade).toBe('C');
    expect(score.violationCounts.critical).toBe(1);
    expect(score.violationCounts.total).toBe(3);
  });

  it('should not go below zero', () => {
    const manyViolations = Array(10).fill({ severity: 'Critical', principle: 'Robust' });
    const score = engine.calculate(manyViolations as Violation[]);
    expect(score.overall).toBe(0);
    expect(score.grade).toBe('F');
  });
});
