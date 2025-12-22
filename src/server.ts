import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { StockTracker } from './services/stockTracker';
import { DataStorage } from './services/dataStorage';
import { StockPriceFetcher } from './services/stockPriceFetcher';
import { config, validateConfig } from './config/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
let tracker: StockTracker;
let storage: DataStorage;
let priceFetcher: StockPriceFetcher;

try {
  validateConfig();
  storage = new DataStorage(config.dataDirectory);
  tracker = new StockTracker(config, storage);
  priceFetcher = new StockPriceFetcher(config.apiKey);
} catch (error) {
  console.error('Failed to initialize services:', error);
  process.exit(1);
}

// API Routes

/**
 * GET /api/status
 * Get tracker status
 */
app.get('/api/status', (req: Request, res: Response) => {
  const status = tracker.getStatus();
  res.json(status);
});

/**
 * GET /api/symbols
 * Get all tracked symbols
 */
app.get('/api/symbols', (req: Request, res: Response) => {
  const symbols = storage.getAllSymbols();
  res.json({ symbols });
});

/**
 * GET /api/stocks/search
 * Search for stock symbols
 */
app.get('/api/stocks/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const results = await priceFetcher.searchSymbols(query);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search symbols' });
  }
});

/**
 * GET /api/stocks/:symbol/history
 * Get daily history for a stock symbol from API
 */
app.get('/api/stocks/:symbol/history', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const history = await priceFetcher.fetchDailyHistory(symbol);
    res.json(history);
  } catch (error) {
    console.error(`History fetch error for ${req.params.symbol}:`, error);
    res.status(500).json({ error: `Failed to fetch history for ${req.params.symbol}` });
  }
});

/**
 * GET /api/history/:symbol
 * Get price history for a specific symbol
 */
app.get('/api/history/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const history = storage.getHistory(symbol.toUpperCase());
  
  if (!history) {
    return res.status(404).json({ error: 'Symbol not found' });
  }
  
  res.json(history);
});

/**
 * GET /api/statistics/:symbol
 * Get statistics for a specific symbol
 */
app.get('/api/statistics/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const stats = storage.getStatistics(symbol.toUpperCase());
  
  if (!stats) {
    return res.status(404).json({ error: 'Symbol not found' });
  }
  
  res.json(stats);
});

/**
 * GET /api/latest
 * Get latest prices for all tracked symbols
 */
app.get('/api/latest', async (req: Request, res: Response) => {
  let symbols = storage.getAllSymbols();

  // If no data, try to fetch immediately (needed for Vercel/serverless where background task might not run)
  if (symbols.length === 0) {
    await tracker.fetchAndStore();
    symbols = storage.getAllSymbols();
  }

  const latestPrices = symbols.map(symbol => {
    const history = storage.getHistory(symbol);
    if (history && history.prices.length > 0) {
      const latestPrice = history.prices[history.prices.length - 1];
      const stats = storage.getStatistics(symbol);
      return {
        ...latestPrice,
        stats
      };
    }
    return null;
  }).filter(Boolean);
  
  res.json({ prices: latestPrices });
});

/**
 * POST /api/tracker/start
 * Start the tracker
 */
app.post('/api/tracker/start', async (req: Request, res: Response) => {
  try {
    await tracker.start();
    res.json({ message: 'Tracker started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start tracker' });
  }
});

/**
 * POST /api/tracker/stop
 * Stop the tracker
 */
app.post('/api/tracker/stop', (req: Request, res: Response) => {
  try {
    tracker.stop();
    res.json({ message: 'Tracker stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop tracker' });
  }
});

// Serve index.html for the root route
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server if main module (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Stock Tracker Server running on http://localhost:${PORT}`);
    console.log(`📊 Tracking symbols: ${config.symbols.join(', ')}`);
    console.log(`⏱️  Update interval: ${config.intervalMs / 1000} seconds`);

    // Auto-start tracker
    tracker.start().catch(console.error);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  tracker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  tracker.stop();
  process.exit(0);
});

export default app;
