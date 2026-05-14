import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger';

// Route imports
import { scanRouter } from './routes/scan.routes';
import { reportRouter } from './routes/report.routes';
import { statsRouter } from './routes/stats.routes';
import { aiRouter } from './routes/ai.routes';
import { settingsRouter } from './routes/settings.routes';

const app: Application = express();

// ─── Security & Parsing Middleware ───────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ─── Static Files (screenshots) ──────────────────────────────
app.use('/screenshots', express.static('./data/screenshots'));
app.use('/reports', express.static('./data/reports'));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'AccessFix API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/scans', scanRouter);
app.use('/api/reports', reportRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

export default app;
