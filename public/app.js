// API base URL
const API_BASE = window.location.origin;

// State
let currentSymbol = '';
let autoRefreshInterval = null;
let stockChart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    startAutoRefresh();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadLatestPrices();
    });

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const symbolSearch = document.getElementById('symbolSearch');

    searchBtn.addEventListener('click', () => {
        const query = symbolSearch.value.trim();
        if (query) {
            searchStocks(query);
        }
    });

    symbolSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = symbolSearch.value.trim();
            if (query) {
                searchStocks(query);
            }
        }
    });
}

// Initialize the application
async function initializeApp() {
    try {
        await loadStatus();
        await loadLatestPrices();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load initial data');
    }
}

// Load tracker status
async function loadStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const data = await response.json();
        
        const statusElement = document.getElementById('trackerStatus');
        statusElement.textContent = data.running ? 'Running' : 'Stopped';
        statusElement.className = `status-badge ${data.running ? 'running' : ''}`;
    } catch (error) {
        console.error('Failed to load status:', error);
    }
}

// Load latest prices for all symbols
async function loadLatestPrices() {
    try {
        const response = await fetch(`${API_BASE}/api/latest`);
        const data = await response.json();
        
        displayStockCards(data.prices);
    } catch (error) {
        console.error('Failed to load latest prices:', error);
        showError('Failed to load stock prices');
    }
}

// Display stock cards
function displayStockCards(prices) {
    const grid = document.getElementById('statsGrid');
    
    if (!prices || prices.length === 0) {
        grid.innerHTML = '<p class="placeholder">No stock data available yet. Waiting for first update...</p>';
        return;
    }
    
    grid.innerHTML = prices.map(stock => `
        <div class="stock-card">
            <div class="symbol">${stock.symbol}</div>
            <div class="price">$${stock.price.toFixed(2)}</div>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">Average</span>
                    <span class="stat-value">$${stock.stats.average.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Min</span>
                    <span class="stat-value">$${stock.stats.min.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Max</span>
                    <span class="stat-value">$${stock.stats.max.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Data Points</span>
                    <span class="stat-value">${stock.stats.count}</span>
                </div>
            </div>
        </div>
    `).join('');
}


// Search stocks
async function searchStocks(query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<p class="loading">Searching...</p>';

    try {
        const response = await fetch(`${API_BASE}/api/stocks/search?query=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p class="error">Search failed</p>';
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
        return;
    }

    resultsContainer.innerHTML = `
        <ul class="results-list" style="list-style: none; padding: 0; border: 1px solid #ccc; max-height: 200px; overflow-y: auto;">
            ${results.map(result => `
                <li class="result-item" style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;"
                    data-symbol="${result['1. symbol']}">
                    <strong>${result['1. symbol']}</strong> - ${result['2. name']} (${result['4. region']})
                </li>
            `).join('')}
        </ul>
    `;

    // Add event listeners to list items
    const listItems = resultsContainer.querySelectorAll('.result-item');
    listItems.forEach(item => {
        item.addEventListener('click', () => {
            selectStock(item.dataset.symbol);
        });
    });
}

// Select a stock
async function selectStock(symbol) {
    document.getElementById('searchResults').innerHTML = ''; // Clear results
    document.getElementById('symbolSearch').value = symbol;

    await fetchStockHistory(symbol);
}

// Fetch stock daily history
async function fetchStockHistory(symbol) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.style.display = 'block';

    // Clear previous chart if any
    if (stockChart) {
        stockChart.destroy();
    }

    // Show loading state on canvas? Or just title
    document.getElementById('chartTitle').textContent = `Loading ${symbol} history...`;
    
    try {
        const response = await fetch(`${API_BASE}/api/stocks/${symbol}/history`);
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        const data = await response.json();

        renderChart(symbol, data);
        document.getElementById('chartTitle').textContent = `${symbol} Stock Price History (YTD)`;
    } catch (error) {
        console.error('History error:', error);
        document.getElementById('chartTitle').textContent = `Error loading ${symbol}`;
    }
}

// Render Chart
function renderChart(symbol, data) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    // Process data for YTD
    const currentYear = new Date().getFullYear();
    const sortedDates = Object.keys(data).sort(); // API returns YYYY-MM-DD keys

    const ytdDates = sortedDates.filter(date => date.startsWith(currentYear.toString()));

    if (ytdDates.length === 0) {
        // Fallback to all data if no YTD data (e.g. early January)
        // or just show what we have.
        // If empty, user might see blank chart.
    }
    
    const prices = ytdDates.map(date => parseFloat(data[date]['4. close']));
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ytdDates,
            datasets: [{
                label: `${symbol} Close Price`,
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

// Show error message
function showError(message) {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `<p class="error">${message}</p>`;
}

// Auto-refresh data
function startAutoRefresh() {
    // Refresh every 30 seconds
    autoRefreshInterval = setInterval(() => {
        loadLatestPrices();
        loadStatus();
        if (currentSymbol) {
            loadHistory(currentSymbol);
        }
    }, 30000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});
