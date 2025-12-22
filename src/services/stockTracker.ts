import { StockPriceFetcher } from './stockPriceFetcher';
import { DataStorage } from './dataStorage';
import { TrackerConfig } from '../models/stock';

/**
 * Main service for tracking stock prices
 */
export class StockTracker {
  private fetcher: StockPriceFetcher;
  private storage: DataStorage;
  private config: TrackerConfig;
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: TrackerConfig, storage?: DataStorage) {
    this.config = config;
    this.fetcher = new StockPriceFetcher(config.apiKey);
    this.storage = storage || new DataStorage(config.dataDirectory);
  }

  /**
   * Start tracking stock prices
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Tracker is already running');
      return;
    }

    this.isRunning = true;
    console.log(`📊 Starting stock tracker for symbols: ${this.config.symbols.join(', ')}`);
    console.log(`⏱️  Update interval: ${this.config.intervalMs / 1000} seconds`);
    
    // Fetch immediately on start
    await this.fetchAndStore();

    // Set up periodic fetching
    this.intervalId = setInterval(async () => {
      await this.fetchAndStore();
    }, this.config.intervalMs);
  }

  /**
   * Stop tracking stock prices
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Tracker is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    console.log('📊 Stock tracker stopped');
  }

  /**
   * Add a symbol to the tracker
   */
  async addSymbol(symbol: string): Promise<void> {
    const upperSymbol = symbol.toUpperCase();

    if (this.config.symbols.includes(upperSymbol)) {
      throw new Error(`Symbol ${upperSymbol} is already being tracked`);
    }

    console.log(`🔍 Validating and adding symbol: ${upperSymbol}`);

    // Fetch price to validate existence and get initial data
    try {
      const price = await this.fetcher.fetchPrice(upperSymbol);

      // If successful, add to config and save initial price
      this.config.symbols.push(upperSymbol);
      this.storage.savePrice(price);

      console.log(`✅ Added ${upperSymbol} to tracker`);
    } catch (error) {
      throw new Error(`Failed to add symbol ${upperSymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a symbol from the tracker
   */
  removeSymbol(symbol: string): void {
    const upperSymbol = symbol.toUpperCase();
    const index = this.config.symbols.indexOf(upperSymbol);

    if (index === -1) {
      throw new Error(`Symbol ${upperSymbol} is not currently tracked`);
    }

    this.config.symbols.splice(index, 1);
    console.log(`🗑️  Removed ${upperSymbol} from tracker`);
  }

  /**
   * Fetch and store current prices
   */
  public async fetchAndStore(): Promise<void> {
    console.log(`\n🔄 Fetching prices at ${new Date().toISOString()}`);
    
    try {
      const prices = await this.fetcher.fetchPrices(this.config.symbols);
      
      if (prices.length === 0) {
        console.log('⚠️  No prices fetched');
        return;
      }

      this.storage.savePrices(prices);
      
      // Display current prices
      for (const price of prices) {
        const stats = this.storage.getStatistics(price.symbol);
        console.log(`\n${price.symbol}:`);
        console.log(`  Current: $${price.price.toFixed(2)}`);
        if (stats) {
          console.log(`  Average: $${stats.average.toFixed(2)}`);
          console.log(`  Min: $${stats.min.toFixed(2)}`);
          console.log(`  Max: $${stats.max.toFixed(2)}`);
          console.log(`  Data points: ${stats.count}`);
        }
      }
      
      console.log(`\n✅ Successfully saved ${prices.length} price(s)`);
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus(): { running: boolean; symbols: string[]; dataPoints: Record<string, number> } {
    const dataPoints: Record<string, number> = {};
    
    for (const symbol of this.storage.getAllSymbols()) {
      const stats = this.storage.getStatistics(symbol);
      dataPoints[symbol] = stats?.count || 0;
    }

    return {
      running: this.isRunning,
      symbols: this.config.symbols,
      dataPoints,
    };
  }
}
