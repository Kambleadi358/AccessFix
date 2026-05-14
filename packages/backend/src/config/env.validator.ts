import { logger } from '../utils/logger';

export function validateEnv(): void {
  const requiredKeys = ['PORT', 'DATABASE_URL', 'AI_PROVIDER'];
  const missingKeys: string[] = [];

  // Check core keys
  requiredKeys.forEach((key) => {
    if (!process.env[key]) {
      missingKeys.push(key);
    }
  });

  // Check provider-specific keys
  const provider = process.env.AI_PROVIDER;
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    missingKeys.push('OPENAI_API_KEY');
  } else if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    missingKeys.push('ANTHROPIC_API_KEY');
  }

  if (missingKeys.length > 0) {
    logger.error('❌ CRITICAL: Missing required environment variables:');
    missingKeys.forEach((key) => {
      logger.error(`   - ${key}`);
    });
    logger.error('Please check your .env file and try again.');
    process.exit(1);
  }

  logger.info('✅ Environment variables validated');
}
