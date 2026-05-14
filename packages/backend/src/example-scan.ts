import 'dotenv/config';
import { scanOrchestrator } from './engine/scan.orchestrator';
import { scanRepository } from './repositories/scan.repository';
import { initDatabase } from './database/db';
import { logger } from './utils/logger';
import fs from 'fs';
import path from 'path';

async function runExample() {
  const url = process.argv[2] || 'https://example.com';
  
  // Ensure data dirs
  const dirs = ['./data', './data/reports', './data/screenshots'];
  dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

  initDatabase();
  logger.info(`Starting example scan for: ${url}`);

  try {
    const result = await scanOrchestrator.scan({
      url,
      options: {
        enableAI: false, // Set to true if you have an API key configured
        captureScreenshot: true
      }
    });

    if (result.status === 'completed') {
      scanRepository.save(result);
      logger.info('Scan saved successfully!');
      logger.info(`Score: ${result.score.overall}/100 (Grade: ${result.score.grade})`);
      logger.info(`Violations found: ${result.violations.length}`);
    } else {
      logger.error(`Scan failed: ${result.error}`);
    }
  } catch (error) {
    logger.error('Unexpected error during example scan:', error);
  } finally {
    process.exit(0);
  }
}

runExample();
