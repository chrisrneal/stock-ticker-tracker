import { StockTracker } from './services/stockTracker';
import { config, validateConfig } from './config/config';

/**
 * Main application entry point
 */
async function main() {
  console.log('🚀 Stock Ticker Tracker');
  console.log('========================\n');

  try {
    // Validate configuration
    validateConfig();

    // Create and start the tracker
    const tracker = new StockTracker(config);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down...');
      tracker.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Shutting down...');
      tracker.stop();
      process.exit(0);
    });

    // Start tracking
    await tracker.start();
    
    console.log('\n💡 Press Ctrl+C to stop tracking\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the application
main();
