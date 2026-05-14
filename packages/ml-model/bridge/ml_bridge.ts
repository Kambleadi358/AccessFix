/**
 * ml_bridge.ts
 * TypeScript bridge that calls the Python ML model via child_process.spawn.
 * Falls back to rule-based scoring when Python / the model is unavailable.
 *
 * Usage (from backend):
 *   import { predictSeverity } from './bridge/ml_bridge';
 *   const result = await predictSeverity({ missing_alt: 1, keyboard_issue: 1 });
 */

import { spawn } from 'child_process';
import * as path from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AccessibilityFeatures {
  missing_alt?:            0 | 1;
  missing_label?:          0 | 1;
  low_contrast?:           0 | 1;
  bad_heading_structure?:  0 | 1;
  missing_aria?:           0 | 1;
  keyboard_issue?:         0 | 1;
}

export interface FeatureDetail {
  feature:    string;
  value:      number;
  importance: number;
}

export interface MLResult {
  severity:    'Critical' | 'Major' | 'Minor';
  confidence:  number;
  top_features: FeatureDetail[];
  source:      'ml-model' | 'rule-based';
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const ML_MODULE_DIR = path.resolve(__dirname, '..');
const PREDICT_SCRIPT = path.join(ML_MODULE_DIR, 'predict.py');

// ── ML prediction (Python) ────────────────────────────────────────────────────

function callPython(features: AccessibilityFeatures): Promise<Omit<MLResult, 'source'>> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(features);
    const proc    = spawn('python', [PREDICT_SCRIPT, payload]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python exited ${code}: ${stderr.trim()}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.error) { reject(new Error(parsed.error)); return; }
        resolve(parsed);
      } catch {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    proc.on('error', reject); // e.g. python not found
  });
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function ruleBasedScore(features: AccessibilityFeatures): MLResult {
  const WEIGHTS: Record<string, number> = {
    missing_alt:           2,
    keyboard_issue:        2,
    missing_label:         1,
    low_contrast:          1,
    bad_heading_structure: 1,
    missing_aria:          1,
  };

  let score = 0;
  const top_features: FeatureDetail[] = [];

  for (const [feat, weight] of Object.entries(WEIGHTS)) {
    const val = (features as Record<string, number>)[feat] ?? 0;
    if (val) {
      score += weight;
      top_features.push({ feature: feat, value: val, importance: weight / 8 });
    }
  }

  top_features.sort((a, b) => b.importance - a.importance);

  const severity: MLResult['severity'] =
    score >= 6 ? 'Critical' :
    score >= 3 ? 'Major'    :
                 'Minor';

  // Rough confidence proxy: how far from a boundary
  const confidence = Math.min(0.6 + score * 0.04, 0.95);

  return { severity, confidence, top_features, source: 'rule-based' };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Predict the severity of an accessibility violation.
 * Prefers the Python ML model; silently falls back to rule-based scoring.
 */
export async function predictSeverity(
  features: AccessibilityFeatures
): Promise<MLResult> {
  try {
    const result = await callPython(features);
    return { ...result, source: 'ml-model' };
  } catch {
    // Python unavailable or model not trained yet → use rule-based fallback
    return ruleBasedScore(features);
  }
}
