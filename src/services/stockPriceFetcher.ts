import axios from 'axios';
import { StockPrice } from '../models/stock';

/**
 * Service for fetching stock price data from Alpha Vantage API
 */
export class StockPriceFetcher {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch the current price for a stock symbol
   */
  async fetchPrice(symbol: string): Promise<StockPrice> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      const quote = response.data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data returned for symbol ${symbol}. API might be rate limited.`);
      }

      return {
        symbol: symbol,
        price: parseFloat(quote['05. price']),
        timestamp: new Date(),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume'], 10),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch prices for multiple symbols
   */
  async fetchPrices(symbols: string[]): Promise<StockPrice[]> {
    const prices: StockPrice[] = [];
    
    // Alpha Vantage has rate limits, so we fetch sequentially with delays
    for (const symbol of symbols) {
      try {
        const price = await this.fetchPrice(symbol);
        prices.push(price);
        
        // Add delay to avoid rate limiting (5 calls per minute for free tier)
        if (symbols.indexOf(symbol) < symbols.length - 1) {
          await this.delay(12000); // 12 seconds between calls
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
      }
    }

    return prices;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
