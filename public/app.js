// API base URL
const API_BASE = window.location.origin;

// State
let currentSymbol = '';
let autoRefreshInterval = null;

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
        if (currentSymbol) {
            loadHistory(currentSymbol);
        }
    });

    document.getElementById('addSymbolBtn').addEventListener('click', handleAddSymbol);

    // Allow pressing Enter to add symbol
    document.getElementById('newSymbolInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddSymbol();
        }
    });

    document.getElementById('symbolSelect').addEventListener('change', (e) => {
        currentSymbol = e.target.value;
        if (currentSymbol) {
            loadHistory(currentSymbol);
        } else {
            showHistoryPlaceholder();
        }
    });

    // Delegate remove button clicks
    document.getElementById('statsGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const symbol = e.target.dataset.symbol;
            handleRemoveSymbol(symbol);
        }
    });
}

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
        await Promise.all([
            loadLatestPrices(),
            loadSymbols()
        ]);

    } catch (error) {
        alert(error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

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

        await Promise.all([
            loadLatestPrices(),
            loadSymbols()
        ]);

        // If the removed symbol was selected in history, clear it
        if (currentSymbol === symbol) {
            currentSymbol = '';
            document.getElementById('symbolSelect').value = '';
            showHistoryPlaceholder();
        }

    } catch (error) {
        alert(error.message);
    }
}

// Initialize the application
async function initializeApp() {
    try {
        await loadStatus();
        await loadLatestPrices();
        await loadSymbols();
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
            <div class="card-header">
                <div class="symbol">${stock.symbol}</div>
                <button class="remove-btn" data-symbol="${stock.symbol}" title="Remove stock">×</button>
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

// Load available symbols
async function loadSymbols() {
    try {
        const response = await fetch(`${API_BASE}/api/symbols`);
        const data = await response.json();
        
        const select = document.getElementById('symbolSelect');
        select.innerHTML = '<option value="">-- Select a symbol --</option>' +
            data.symbols.map(symbol => `<option value="${symbol}">${symbol}</option>`).join('');
    } catch (error) {
        console.error('Failed to load symbols:', error);
    }
}

// Load price history for a symbol
async function loadHistory(symbol) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = '<p class="loading">Loading history...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/api/history/${symbol}`);
        
        if (!response.ok) {
            throw new Error('Symbol not found');
        }
        
        const data = await response.json();
        displayHistory(data);
    } catch (error) {
        console.error('Failed to load history:', error);
        container.innerHTML = '<p class="error">Failed to load price history</p>';
    }
}

// Display price history
function displayHistory(history) {
    const container = document.getElementById('historyContainer');
    
    if (!history.prices || history.prices.length === 0) {
        container.innerHTML = '<p class="placeholder">No price history available</p>';
        return;
    }
    
    // Show the most recent 20 prices
    const recentPrices = history.prices.slice(-20).reverse();
    
    container.innerHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Price</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Volume</th>
                </tr>
            </thead>
            <tbody>
                ${recentPrices.map(price => `
                    <tr>
                        <td>${new Date(price.timestamp).toLocaleString()}</td>
                        <td><strong>$${price.price.toFixed(2)}</strong></td>
                        <td>${price.open ? '$' + price.open.toFixed(2) : 'N/A'}</td>
                        <td>${price.high ? '$' + price.high.toFixed(2) : 'N/A'}</td>
                        <td>${price.low ? '$' + price.low.toFixed(2) : 'N/A'}</td>
                        <td>${price.volume ? price.volume.toLocaleString() : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Show history placeholder
function showHistoryPlaceholder() {
    const container = document.getElementById('historyContainer');
    container.innerHTML = '<p class="placeholder">Select a symbol to view price history</p>';
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
