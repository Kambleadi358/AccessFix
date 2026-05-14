import 'dotenv/config';
import { validateEnv } from './config/env.validator';
import { loadSettings } from './config/settings.loader';
import app from './app';
import { initDatabase } from './database/db';
import { logger } from './utils/logger';
import path from 'path';
import fs from 'fs';

// Validate environment on startup
validateEnv();

const PORT = parseInt(process.env.PORT || '4000', 10);

// Ensure required directories exist
const dirs = [
  path.resolve('./data'),
  path.resolve('./data/reports'),
  path.resolve('./data/screenshots'),
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function bootstrap(): Promise<void> {
  try {
    // Initialise SQLite database
    initDatabase();
    
    // Load custom settings from DB to override process.env
    loadSettings();
    
    logger.info('✅ Database initialised');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 AccessFix API running at http://localhost:${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server', err);
    process.exit(1);
  }
}

bootstrap();
