# Stock Ticker Tracker

A full-stack TypeScript web application that tracks stock prices in real-time, with a beautiful dashboard UI for monitoring multiple stocks and analyzing historical performance data.

## Features

- 🌐 **Web Dashboard** - Beautiful, responsive UI for monitoring stocks
- 📊 Real-time stock price tracking
- 📈 Interactive price history visualization
- 💾 Historical data storage (JSON-based)
- 📉 Statistics (min, max, average) for each stock
- 🔄 Auto-refresh every 30 seconds
- 🎯 Support for multiple stock symbols
- 🚀 REST API for programmatic access
- 📱 Mobile-responsive design
- 🚀 Easy to extend for forecasting algorithms

## Screenshots

The web dashboard displays:
- Live stock prices with color-coded cards
- Real-time statistics for each symbol
- Interactive price history table
- Auto-refreshing data

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
PORT=3000
```

Get a free API key from: https://www.alphavantage.co/support/#api-key

## Usage

### Web Application (Recommended)
Start the web server with dashboard:
```bash
npm run dev
```

Then open your browser to: `http://localhost:3000`

### CLI Mode
Run the command-line tracker:
```bash
npm run dev:cli
```

### Production Mode
Build and run the compiled application:
```bash
npm run build
npm start
```

## REST API

The application provides a REST API for programmatic access:

### Endpoints

- `GET /api/status` - Get tracker status (running/stopped)
- `GET /api/symbols` - Get list of all tracked symbols
- `GET /api/latest` - Get latest prices for all symbols
- `GET /api/history/:symbol` - Get price history for a specific symbol
- `GET /api/statistics/:symbol` - Get statistics for a specific symbol
- `POST /api/tracker/start` - Start the tracker
- `POST /api/tracker/stop` - Stop the tracker

### Example API Usage

```bash
# Get latest prices
curl http://localhost:3000/api/latest

# Get history for AAPL
curl http://localhost:3000/api/history/AAPL

# Get statistics for GOOGL
curl http://localhost:3000/api/statistics/GOOGL
```

## Configuration

Configure the tracker via environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `ALPHA_VANTAGE_API_KEY` | Your Alpha Vantage API key | `demo` |
| `STOCK_SYMBOLS` | Comma-separated stock symbols | `AAPL,GOOGL,MSFT` |
| `TRACKING_INTERVAL_MS` | Update interval in milliseconds | `60000` (1 minute) |
| `DATA_DIRECTORY` | Directory for data storage | `./data` |
| `PORT` | Web server port | `3000` |

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
│   ├── server.ts        # Express web server
│   ├── cli.ts           # CLI interface
│   └── index.ts         # Main entry point
├── public/              # Web dashboard (HTML/CSS/JS)
│   ├── index.html       # Main dashboard page
│   ├── styles.css       # Styling
│   └── app.js           # Frontend JavaScript
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

