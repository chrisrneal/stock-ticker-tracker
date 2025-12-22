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
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      try {
        const price = await this.fetchPrice(symbol);
        prices.push(price);
        
        // Add delay to avoid rate limiting (5 calls per minute for free tier)
        if (i < symbols.length - 1) {
          await this.delay(12000); // 12 seconds between calls
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
      }
    }

    return prices;
  }

  /**
   * Fetch daily history for a stock symbol
   */
  async fetchDailyHistory(symbol: string): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        throw new Error(`API rate limit exceeded or other note: ${response.data['Note']}`);
      }

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error(`No daily history data returned for symbol ${symbol}`);
      }

      return timeSeries;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch history for ${symbol}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Search for stock symbols
   */
  async searchSymbols(keywords: string): Promise<any[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: keywords,
          apikey: this.apiKey,
        },
      });

      if (response.data['Error Message']) {
         throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
         throw new Error(`API rate limit exceeded or other note: ${response.data['Note']}`);
      }

      return response.data['bestMatches'] || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to search symbols for ${keywords}: ${error.message}`);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
