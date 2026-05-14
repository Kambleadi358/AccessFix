import Database from 'better-sqlite3';
import path from 'path';

import { logger } from '../utils/logger';

const DB_PATH = path.resolve(
  process.env.DATABASE_URL || './data/accessfix.db'
);

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    logger.info(`Database ready at ${DB_PATH}`);
  }

  return db;
}

export function initDatabase(): void {
  const database = getDb();

  // ─────────────────────────────────────────
  // scans
  // ─────────────────────────────────────────

  database.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      scanned_at TEXT NOT NULL,

      duration_ms INTEGER DEFAULT 0,

      overall_score REAL DEFAULT 0,
      grade TEXT DEFAULT 'F',
      pass_rate REAL DEFAULT 0,

      critical_count INTEGER DEFAULT 0,
      major_count INTEGER DEFAULT 0,
      minor_count INTEGER DEFAULT 0,

      passed_checks INTEGER DEFAULT 0,
      failed_checks INTEGER DEFAULT 0,

      status TEXT DEFAULT 'completed',

      error TEXT,

      screenshot_path TEXT,

      page_title TEXT,
      page_language TEXT,

      raw_result TEXT NOT NULL
    );
  `);

  // ─────────────────────────────────────────
  // violations
  // ─────────────────────────────────────────

  database.exec(`
    CREATE TABLE IF NOT EXISTS violations (
      id TEXT PRIMARY KEY,

      scan_id TEXT NOT NULL,

      rule_id TEXT NOT NULL,
      wcag TEXT NOT NULL,
      level TEXT NOT NULL,
      principle TEXT NOT NULL,

      title TEXT NOT NULL,
      severity TEXT NOT NULL,

      selector TEXT NOT NULL,

      message TEXT NOT NULL,
      how_to_fix TEXT NOT NULL,

      fixable INTEGER DEFAULT 0,

      html_snippet TEXT,

      FOREIGN KEY (scan_id)
      REFERENCES scans(id)
      ON DELETE CASCADE
    );
  `);

  // ─────────────────────────────────────────
  // ai_suggestions
  // ─────────────────────────────────────────

  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_suggestions (
      id TEXT PRIMARY KEY,

      scan_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,

      original_html TEXT NOT NULL,
      fixed_html TEXT NOT NULL,

      explanation TEXT NOT NULL,
      accessibility_impact TEXT NOT NULL,

      confidence REAL DEFAULT 0,

      FOREIGN KEY (scan_id)
      REFERENCES scans(id)
      ON DELETE CASCADE
    );
  `);

  // ─────────────────────────────────────────
  // app_settings
  // ─────────────────────────────────────────

  database.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ─────────────────────────────────────────
  // indexes
  // ─────────────────────────────────────────

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_violations_scan_id
    ON violations(scan_id);
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_ai_suggestions_scan_id
    ON ai_suggestions(scan_id);
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_scans_scanned_at
    ON scans(scanned_at DESC);
  `);

  // ─── Migrations for existing databases ─────────────
  try {
    database.exec('ALTER TABLE scans ADD COLUMN passed_checks INTEGER DEFAULT 0');
    logger.info('Migration: Added passed_checks column to scans table');
  } catch (e) {}
  
  try {
    database.exec('ALTER TABLE scans ADD COLUMN failed_checks INTEGER DEFAULT 0');
    logger.info('Migration: Added failed_checks column to scans table');
  } catch (e) {}
}