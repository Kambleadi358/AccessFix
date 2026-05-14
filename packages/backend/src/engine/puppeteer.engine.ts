import puppeteer, { Browser, Page } from 'puppeteer';
import { ScanOptions } from '@accessfix/shared';
import { logger } from '../utils/logger';

export interface RenderedPage {
  html: string;
  url: string;
  screenshotBase64?: string;
  screenshotPath?: string;
  pageTitle: string;
  pageLanguage: string;
  renderTimeMs: number;
}

export interface RenderError {
  status: 'failed';
  reason: string;
  url: string;
  details?: string;
}

export class PuppeteerEngine {
  private browser: Browser | null = null;

  /** Launch the headless browser (reused across scans if kept warm) */
  async launch(): Promise<void> {
    if (this.browser) return;

    logger.info('Launching Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10),
    });
    logger.info('Puppeteer browser launched');
  }

  /** Close the browser instance */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  /**
   * Full rendering pipeline with improved error recovery
   */
  async render(url: string, options: ScanOptions = {}): Promise<RenderedPage | RenderError> {
    if (!this.browser) await this.launch();

    let page: Page | null = null;
    const startTime = Date.now();

    try {
      page = await this.browser!.newPage();

      // Set realistic viewport
      await page.setViewport({
        width: options.viewportWidth || 1280,
        height: options.viewportHeight || 800,
        deviceScaleFactor: 1,
      });

      // Set user agent to avoid bot blocks
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AccessFix/1.0'
      );

      const timeout = options.timeout || parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10);

      logger.info(`Navigating to: ${url}`);
      
      try {
        await page.goto(url, {
          waitUntil: (options.waitUntil as any) || 'networkidle2',
          timeout,
        });
      } catch (navErr: any) {
        let reason = 'Navigation failed';
        if (navErr.message.includes('timeout')) reason = 'Timeout reached during page load';
        else if (navErr.message.includes('ERR_NAME_NOT_RESOLVED')) reason = 'Invalid URL or DNS failure';
        else if (navErr.message.includes('ERR_CONNECTION_REFUSED')) reason = 'Connection refused by server';
        else if (navErr.message.includes('ERR_INVALID_URL')) reason = 'Invalid URL format';
        
        logger.error(`[PuppeteerEngine] Navigation error: ${navErr.message}`);
        return {
          status: 'failed',
          reason,
          url,
          details: navErr.message
        };
      }

      // Wait for page to stabilise (dynamic SPAs)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ── Extract full rendered DOM ──────────────────────────
      const html = await page.content();
      const pageTitle = await page.title();
      const pageLanguage = await page
        .evaluate(() => document.documentElement.lang || '')
        .catch(() => '');

      // ── Screenshot ────────────────────────────────────────
      let screenshotBase64: string | undefined;
      let screenshotPath: string | undefined;

      if (options.captureScreenshot !== false) {
        const scanId = Date.now().toString();
        screenshotPath = `./data/screenshots/${scanId}.png`;

        const buffer = await page.screenshot({
          type: 'png',
          fullPage: false,
        });

        screenshotBase64 = buffer.toString('base64');
        const fs = await import('fs');
        fs.writeFileSync(screenshotPath, buffer);
      }

      const renderTimeMs = Date.now() - startTime;
      logger.info(`Page rendered in ${renderTimeMs}ms`);

      return {
        html,
        url: page.url(),
        screenshotBase64,
        screenshotPath,
        pageTitle,
        pageLanguage,
        renderTimeMs,
      };
    } catch (err: any) {
      logger.error(`[PuppeteerEngine] Unexpected error: ${err.message}`);
      return {
        status: 'failed',
        reason: 'Internal rendering engine error',
        url,
        details: err.message
      };
    } finally {
      if (page) await page.close();
    }
  }
}

export const puppeteerEngine = new PuppeteerEngine();

