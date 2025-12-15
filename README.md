# Stock Ticker Tracker

A TypeScript-based application that tracks stock prices over time, providing a foundation for predictive forecasting methods and performance predictability analysis.

## Features

- 📊 Real-time stock price tracking
- 💾 Historical data storage (JSON-based)
- 📈 Basic statistics (min, max, average)
- 🔄 Configurable update intervals
- 🎯 Support for multiple stock symbols
- 🚀 Easy to extend for forecasting algorithms

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Alpha Vantage API key (free tier available)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/chrisrneal/stock-ticker-tracker.git
cd stock-ticker-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Alpha Vantage API key:
```
ALPHA_VANTAGE_API_KEY=your_api_key_here
STOCK_SYMBOLS=AAPL,GOOGL,MSFT
TRACKING_INTERVAL_MS=60000
```

Get a free API key from: https://www.alphavantage.co/support/#api-key

## Usage

### Development Mode
Run with auto-reload on code changes:
```bash
npm run dev
```

### Watch Mode
Continuous development with automatic restarts:
```bash
npm run watch
```

### Production Mode
Build and run the compiled application:
```bash
npm run build
npm start
```

## Configuration

Configure the tracker via environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `ALPHA_VANTAGE_API_KEY` | Your Alpha Vantage API key | `demo` |
| `STOCK_SYMBOLS` | Comma-separated stock symbols | `AAPL,GOOGL,MSFT` |
| `TRACKING_INTERVAL_MS` | Update interval in milliseconds | `60000` (1 minute) |
| `DATA_DIRECTORY` | Directory for data storage | `./data` |

## Project Structure

```
stock-ticker-tracker/
├── src/
│   ├── config/          # Configuration management
│   ├── models/          # TypeScript interfaces and types
│   ├── services/        # Core business logic
│   │   ├── stockPriceFetcher.ts   # Fetches prices from API
│   │   ├── dataStorage.ts         # Manages data persistence
│   │   └── stockTracker.ts        # Main tracking service
│   ├── utils/           # Helper functions
│   └── index.ts         # Application entry point
├── data/                # Stored price history (JSON files)
├── dist/                # Compiled JavaScript (generated)
└── tests/               # Test files

```

## Data Storage

Price data is stored in JSON files (one per symbol) in the `data/` directory:

```json
{
  "symbol": "AAPL",
  "prices": [
    {
      "symbol": "AAPL",
      "price": 150.25,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "open": 149.50,
      "high": 151.00,
      "low": 149.00,
      "volume": 50000000
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

## API Rate Limits

Alpha Vantage free tier allows:
- 5 API requests per minute
- 500 requests per day

The application automatically adds delays between requests to respect these limits.

## Future Enhancements

This boilerplate is ready for expansion:
- 🤖 Add predictive forecasting algorithms
- 📊 Implement performance predictability metrics
- 📈 Add data visualization
- 🗄️ Integrate with databases (PostgreSQL, MongoDB)
- 🌐 Build a web dashboard
- 📱 Create REST API endpoints
- 🔔 Add price alerts and notifications
- 📉 Implement technical indicators (RSI, MACD, etc.)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

