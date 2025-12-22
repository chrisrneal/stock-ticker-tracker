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

    // Search functionality (for graph)
    const searchBtn = document.getElementById('searchBtn');
    const symbolSearch = document.getElementById('symbolSearch');

    if (searchBtn && symbolSearch) {
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

    // Add Symbol functionality (from main)
    const addSymbolBtn = document.getElementById('addSymbolBtn');
    const newSymbolInput = document.getElementById('newSymbolInput');

    if (addSymbolBtn && newSymbolInput) {
        addSymbolBtn.addEventListener('click', handleAddSymbol);
        newSymbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddSymbol();
            }
        });
    }

    // Delegate remove button clicks (from main)
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const symbol = e.target.dataset.symbol;
                handleRemoveSymbol(symbol);
            }
        });
    }
}

// Add Symbol Handler (from main)
async function handleAddSymbol() {
    const input = document.getElementById('newSymbolInput');
    const symbol = input.value.trim();
    const btn = document.getElementById('addSymbolBtn');

    if (!symbol) return;

    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    input.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/symbols`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symbol })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add symbol');
        }

        input.value = '';
        await loadLatestPrices(); // Just reload prices, no loadSymbols() needed as cards are self-contained

    } catch (error) {
        alert(error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

// Remove Symbol Handler (from main)
async function handleRemoveSymbol(symbol) {
    if (!confirm(`Are you sure you want to stop tracking ${symbol}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/symbols/${symbol}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to remove symbol');
        }

        await loadLatestPrices();

    } catch (error) {
        alert(error.message);
    }
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
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div class="symbol" style="font-weight: bold;">${stock.symbol}</div>
                <button class="remove-btn" data-symbol="${stock.symbol}" title="Remove stock" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
            </div>
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


// Search stocks (Graph)
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
    if (chartContainer) {
        chartContainer.style.display = 'block';
    }

    // Clear previous chart if any
    if (stockChart) {
        stockChart.destroy();
    }

    const chartTitle = document.getElementById('chartTitle');
    if (chartTitle) {
        chartTitle.textContent = `Loading ${symbol} history...`;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/stocks/${symbol}/history`);
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        const data = await response.json();

        renderChart(symbol, data);
        if (chartTitle) {
            chartTitle.textContent = `${symbol} Stock Price History (YTD)`;
        }
    } catch (error) {
        console.error('History error:', error);
        if (chartTitle) {
            chartTitle.textContent = `Error loading ${symbol}`;
        }
    }
}

// Render Chart
function renderChart(symbol, data) {
    const canvas = document.getElementById('stockChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    // Process data for YTD
    const currentYear = new Date().getFullYear();
    const sortedDates = Object.keys(data).sort(); // API returns YYYY-MM-DD keys

    // In fallback mode or early year, we might just want to show whatever data we have
    // But let's stick to YTD logic or last 365 days if YTD is empty
    let chartDates = sortedDates.filter(date => date.startsWith(currentYear.toString()));

    if (chartDates.length === 0) {
        // Fallback: Show last 30 points if YTD is empty
        chartDates = sortedDates.slice(-30);
    }
    
    const prices = chartDates.map(date => parseFloat(data[date]['4. close']));
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartDates,
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
    if (grid) {
        grid.innerHTML = `<p class="error">${message}</p>`;
    }
}

// Auto-refresh data
function startAutoRefresh() {
    // Refresh every 30 seconds
    autoRefreshInterval = setInterval(() => {
        loadLatestPrices();
        loadStatus();
    }, 30000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});
