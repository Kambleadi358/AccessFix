import { getDb } from '../database/db';
import { logger } from '../utils/logger';

export function loadSettings() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM app_settings').all() as Array<{ key: string; value: string }>;
    
    if (rows.length === 0) {
      logger.info('[Settings] No custom settings in database, using .env defaults');
      return;
    }

    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    // Override process.env so existing services pick them up
    if (settings.aiProvider)      process.env.AI_PROVIDER      = settings.aiProvider;
    if (settings.modelName)       process.env.OPENAI_MODEL     = settings.modelName; 
    if (settings.criticalPenalty) process.env.CRITICAL_PENALTY = settings.criticalPenalty;
    if (settings.majorPenalty)    process.env.MAJOR_PENALTY    = settings.majorPenalty;
    if (settings.minorPenalty)    process.env.MINOR_PENALTY    = settings.minorPenalty;

    logger.info('[Settings] Application settings loaded and applied');
  } catch (err) {
    logger.warn('[Settings] Failed to load settings from DB:', err);
  }
}
