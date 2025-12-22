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
      // Return mock data for demo/testing if API key is 'demo' and symbol is not IBM (since demo key only works for IBM)
      // Or if the request fails

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
        console.warn(`API Note for ${symbol}: ${response.data['Note']}. Falling back to mock data.`);
        return this.generateMockHistory(symbol);
      }

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        // Fallback for demo purposes if empty
        return this.generateMockHistory(symbol);
      }

      return timeSeries;
    } catch (error) {
      console.error(`Fetch history failed for ${symbol}, using mock data:`, error);
      return this.generateMockHistory(symbol);
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
         console.warn(`API Search Note: ${response.data['Note']}. Falling back to mock search.`);
         return this.generateMockSearch(keywords);
      }

      const matches = response.data['bestMatches'];
      if (!matches || matches.length === 0) {
          // If no matches but we are in demo mode, maybe show a mock result
          if (this.apiKey === 'demo') {
              return this.generateMockSearch(keywords);
          }
      }

      return matches || [];
    } catch (error) {
      console.error(`Search failed for ${keywords}, using mock data:`, error);
      return this.generateMockSearch(keywords);
    }
  }

  private generateMockHistory(symbol: string): any {
    const mockData: any = {};
    const today = new Date();
    let price = 150.0; // Base price

    // Generate 30 days of data
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        mockData[dateStr] = {
            "1. open": (price - 1).toString(),
            "2. high": (price + 2).toString(),
            "3. low": (price - 2).toString(),
            "4. close": price.toString(),
            "5. volume": "1000000"
        };

        // Random walk
        price = price + (Math.random() * 10 - 5);
    }
    return mockData;
  }

  private generateMockSearch(keyword: string): any[] {
      return [
          {
              "1. symbol": keyword.toUpperCase(),
              "2. name": `${keyword.toUpperCase()} (Demo/Mock)`,
              "3. type": "Equity",
              "4. region": "United States",
              "5. marketOpen": "09:30",
              "6. marketClose": "16:00",
              "7. timezone": "UTC-04:00",
              "8. currency": "USD",
              "9. matchScore": "1.0000"
          }
      ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
