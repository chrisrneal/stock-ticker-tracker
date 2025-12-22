import { DataStorage } from '../src/services/dataStorage';
import { StockPrice } from '../src/models/stock';
import fs from 'fs';
import path from 'path';

describe('DataStorage', () => {
  const testDataDir = '/tmp/test-stock-data';
  let storage: DataStorage;

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
    storage = new DataStorage(testDataDir);
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
  });

  describe('savePrice', () => {
    it('should save a stock price', () => {
      const price: StockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      };

      storage.savePrice(price);

      const filePath = path.join(testDataDir, 'AAPL.json');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should append to existing price history', () => {
      const price1: StockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      };

      const price2: StockPrice = {
        symbol: 'AAPL',
        price: 151.00,
        timestamp: new Date('2024-01-15T11:00:00Z'),
      };

      storage.savePrice(price1);
      storage.savePrice(price2);

      const history = storage.getHistory('AAPL');
      expect(history).not.toBeNull();
      expect(history?.prices).toHaveLength(2);
    });
  });

  describe('getHistory', () => {
    it('should return null for non-existent symbol', () => {
      const history = storage.getHistory('NONEXISTENT');
      expect(history).toBeNull();
    });

    it('should return price history for existing symbol', () => {
      const price: StockPrice = {
        symbol: 'GOOGL',
        price: 2800.50,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      };

      storage.savePrice(price);

      const history = storage.getHistory('GOOGL');
      expect(history).not.toBeNull();
      expect(history?.symbol).toBe('GOOGL');
      expect(history?.prices).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return null for non-existent symbol', () => {
      const stats = storage.getStatistics('NONEXISTENT');
      expect(stats).toBeNull();
    });

    it('should calculate statistics for existing data', () => {
      const prices: StockPrice[] = [
        { symbol: 'MSFT', price: 100, timestamp: new Date() },
        { symbol: 'MSFT', price: 150, timestamp: new Date() },
        { symbol: 'MSFT', price: 200, timestamp: new Date() },
      ];

      storage.savePrices(prices);

      const stats = storage.getStatistics('MSFT');
      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.average).toBe(150);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(200);
    });
  });

  describe('getAllSymbols', () => {
    it('should return empty array when no data exists', () => {
      const symbols = storage.getAllSymbols();
      expect(symbols).toEqual([]);
    });

    it('should return all tracked symbols', () => {
      const price1: StockPrice = {
        symbol: 'AAPL',
        price: 150,
        timestamp: new Date(),
      };

      const price2: StockPrice = {
        symbol: 'GOOGL',
        price: 2800,
        timestamp: new Date(),
      };

      storage.savePrice(price1);
      storage.savePrice(price2);

      const symbols = storage.getAllSymbols();
      expect(symbols).toHaveLength(2);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('GOOGL');
    });
  });
});
