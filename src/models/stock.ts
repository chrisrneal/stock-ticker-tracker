/**
 * Represents a stock price data point
 */
export interface StockPrice {
  symbol: string;
  price: number;
  timestamp: Date;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

/**
 * Represents a collection of stock prices for a symbol
 */
export interface StockHistory {
  symbol: string;
  prices: StockPrice[];
  lastUpdated: Date;
}

/**
 * Configuration for stock tracking
 */
export interface TrackerConfig {
  symbols: string[];
  intervalMs: number;
  apiKey: string;
  dataDirectory: string;
}
