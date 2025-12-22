import dotenv from 'dotenv';
import { TrackerConfig } from '../models/stock';

dotenv.config();

/**
 * Application configuration loaded from environment variables
 */
export const config: TrackerConfig = {
  symbols: (process.env.STOCK_SYMBOLS || 'AAPL,GOOGL,MSFT').split(',').map(s => s.trim()),
  intervalMs: parseInt(process.env.TRACKING_INTERVAL_MS || '60000', 10),
  apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
  dataDirectory: process.env.DATA_DIRECTORY || './data',
};

/**
 * Validate the configuration
 */
export function validateConfig(): void {
  if (!config.apiKey || config.apiKey === 'demo') {
    console.warn('⚠️  Warning: Using demo API key. Get a free key from https://www.alphavantage.co/support/#api-key');
  }

  if (config.symbols.length === 0) {
    throw new Error('No stock symbols configured');
  }

  if (config.intervalMs < 1000) {
    throw new Error('Tracking interval must be at least 1000ms');
  }
}
