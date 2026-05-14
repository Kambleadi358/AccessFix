import { Request, Response } from 'express';
import { getDb } from '../database/db';
import { logger } from '../utils/logger';

export class SettingsController {
  /** GET /api/settings */
  getSettings(req: Request, res: Response) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM app_settings').all() as Array<{ key: string; value: string }>;
    
    // Map array of {key, value} to an object
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    // Fallback to env if DB is empty
    const response = {
      aiProvider:      settings.aiProvider      || process.env.AI_PROVIDER      || 'openai',
      modelName:       settings.modelName       || process.env.OPENAI_MODEL     || 'gpt-4o',
      criticalPenalty: parseFloat(settings.criticalPenalty || '1.0'),
      majorPenalty:    parseFloat(settings.majorPenalty    || '0.5'),
      minorPenalty:    parseFloat(settings.minorPenalty    || '0.1'),
    };

    res.json({ success: true, data: response });
  }

  /** PATCH /api/settings */
  updateSettings(req: Request, res: Response) {
    const db = getDb();
    const updates = req.body;
    
    const allowedKeys = ['aiProvider', 'modelName', 'criticalPenalty', 'majorPenalty', 'minorPenalty'];
    
    db.transaction(() => {
      const upsert = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
      
      for (const key of allowedKeys) {
        if (updates[key] !== undefined) {
          upsert.run(key, String(updates[key]));
        }
      }
    })();

    logger.info('[Settings] Updated application settings');
    res.json({ success: true, message: 'Settings saved successfully' });
  }
}

export const settingsController = new SettingsController();
