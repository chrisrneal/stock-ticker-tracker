/**
 * Example usage of the Stock Tracker library
 * 
 * This demonstrates how to use the tracker programmatically in your own code
 */

import { StockTracker } from './src/services/stockTracker';
import { TrackerConfig } from './src/models/stock';
import { DataStorage } from './src/services/dataStorage';

// Example 1: Basic usage with default configuration
async function basicExample() {
  const config: TrackerConfig = {
    symbols: ['AAPL', 'GOOGL', 'MSFT'],
    intervalMs: 60000, // 1 minute
    apiKey: 'your_api_key_here',
    dataDirectory: './data',
  };

  const tracker = new StockTracker(config);
  
  // Start tracking
  await tracker.start();
  
  // Stop after some time
  setTimeout(() => {
    tracker.stop();
  }, 300000); // Stop after 5 minutes
}

// Example 2: Accessing historical data
function accessDataExample() {
  const storage = new DataStorage('./data');
  
  // Get price history for a symbol
  const appleHistory = storage.getHistory('AAPL');
  if (appleHistory) {
    console.log(`AAPL has ${appleHistory.prices.length} data points`);
    console.log('Latest price:', appleHistory.prices[appleHistory.prices.length - 1]);
  }
  
  // Get statistics
  const stats = storage.getStatistics('AAPL');
  if (stats) {
    console.log('Statistics for AAPL:', stats);
  }
  
  // List all tracked symbols
  const symbols = storage.getAllSymbols();
  console.log('All tracked symbols:', symbols);
}

// Example 3: Custom tracking interval
async function customIntervalExample() {
  const config: TrackerConfig = {
    symbols: ['IBM'],
    intervalMs: 300000, // 5 minutes
    apiKey: 'your_api_key_here',
    dataDirectory: './data',
  };

  const tracker = new StockTracker(config);
  await tracker.start();
}

// Run examples (uncomment the one you want to try)
// basicExample();
// accessDataExample();
// customIntervalExample();
