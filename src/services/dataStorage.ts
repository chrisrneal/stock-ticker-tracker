import fs from 'fs';
import path from 'path';
import { StockPrice, StockHistory } from '../models/stock';

/**
 * Service for storing and retrieving stock price data
 */
export class DataStorage {
  private dataDirectory: string;

  constructor(dataDirectory: string) {
    this.dataDirectory = dataDirectory;
    this.ensureDataDirectory();
  }

  /**
   * Ensure the data directory exists
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  /**
   * Get the file path for a symbol's data
   */
  private getFilePath(symbol: string): string {
    return path.join(this.dataDirectory, `${symbol}.json`);
  }

  /**
   * Save a stock price data point
   */
  savePrice(price: StockPrice): void {
    const filePath = this.getFilePath(price.symbol);
    let history: StockHistory;

    // Load existing history or create new
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      history = JSON.parse(data);
      history.prices.push(price);
      history.lastUpdated = new Date();
    } else {
      history = {
        symbol: price.symbol,
        prices: [price],
        lastUpdated: new Date(),
      };
    }

    // Save updated history
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  }

  /**
   * Save multiple stock prices
   */
  savePrices(prices: StockPrice[]): void {
    for (const price of prices) {
      this.savePrice(price);
    }
  }

  /**
   * Get the price history for a symbol
   */
  getHistory(symbol: string): StockHistory | null {
    const filePath = this.getFilePath(symbol);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Get all tracked symbols
   */
  getAllSymbols(): string[] {
    const files = fs.readdirSync(this.dataDirectory);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Get statistics for a symbol
   */
  getStatistics(symbol: string): { count: number; average: number; min: number; max: number } | null {
    const history = this.getHistory(symbol);
    
    if (!history || history.prices.length === 0) {
      return null;
    }

    const prices = history.prices.map(p => p.price);
    const sum = prices.reduce((a, b) => a + b, 0);
    
    return {
      count: prices.length,
      average: sum / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }
}
