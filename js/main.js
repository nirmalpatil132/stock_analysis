document.addEventListener('DOMContentLoaded', () => {
    const state = {
        socket: null,
        currentSymbol: null,
        isLoggedIn: false,
        watchlist: [],
    };

    const searchInput = document.getElementById('search-input');

    function init() {
        chartManager.initChart('chart-container');
        setupEventListeners();
        checkLoginState();
        connectSocket();
    }

    function connectSocket() {
        state.socket = io('http://localhost:3000');
        state.socket.on('connect', () => console.log('Connected to WebSocket server.'));
        state.socket.on('stock_update', (data) => {
            if (data.time && state.currentSymbol === data.symbol) {
                chartManager.updateChart(data);
            }
        });
        state.socket.on('disconnect', () => console.log('Disconnected from WebSocket server.'));
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', handleSearchInput);
        document.getElementById('search-results').addEventListener('click', handleSearchResultClick);
        ui.loginBtn.addEventListener('click', () => ui.toggleModal(ui.loginModalEl, true));
        ui.registerBtn.addEventListener('click', () => ui.toggleModal(ui.registerModalEl, true));
        ui.logoutBtn.addEventListener('click', handleLogout);

        document.querySelectorAll('.modal .close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                ui.toggleModal(modal, false);
            });
        });

        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        ui.watchlistEl.addEventListener('click', handleWatchlistClick);
        document.getElementById('company-profile').addEventListener('click', handleAddToWatchlist);
    }

    function checkLoginState() {
        const token = localStorage.getItem('token');
        state.isLoggedIn = !!token;
        ui.updateAuthState(state.isLoggedIn);
        if (state.isLoggedIn) {
            loadWatchlist();
        } else {
            ui.renderWatchlist([]);
        }
    }

    async function loadWatchlist() {
        if (!state.isLoggedIn) return;
        try {
            const watchlist = await api.getWatchlist();
            state.watchlist = watchlist.map(stock => stock.symbol);
            ui.renderWatchlist(watchlist);
        } catch (error) {
            console.error('Failed to load watchlist:', error);
            if (error.message.includes('401') || error.message.includes('403')) {
                handleLogout();
            }
        }
    }

    async function handleSearchInput(e) {
        const query = e.target.value;
        if (query.length < 1) {
            ui.clearSearchResults();
            return;
        }
        if (!state.isLoggedIn) {
            ui.showFormError('login-form', 'Please log in to search for stocks.');
            ui.toggleModal(ui.loginModalEl, true);
            return;
        }
        try {
            const results = await api.searchStocks(query);
            ui.renderSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    function handleSearchResultClick(e) {
        const item = e.target.closest('.search-result-item');
        if (item) {
            const symbol = item.dataset.symbol;
            const name = item.dataset.name;
            selectStock(symbol, name);
            ui.clearSearchResults();
            searchInput.value = '';
        }
    }

    async function selectStock(symbol, name) {
        if (state.currentSymbol) {
            state.socket.emit('unsubscribe', state.currentSymbol);
        }
        state.currentSymbol = symbol;

        ui.toggleLoading(true);
        try {
            const data = await api.getHistoricalData(symbol);
            chartManager.setChartData(data.data);
            const isWatched = state.watchlist.includes(symbol);
            ui.updateCompanyProfile({ symbol: data.symbol, name }, isWatched);
            state.socket.emit('subscribe', { symbol, socketId: state.socket.id });
        } catch (error) {
            console.error('Failed to get historical data:', error);
            alert('Could not load data for this stock.');
        } finally {
            ui.toggleLoading(false);
        }
    }

    async function handleWatchlistClick(e) {
        const item = e.target.parentElement;
        const symbol = item.dataset.symbol;
        const name = item.dataset.name;

        if (e.target.closest('.watchlist-symbol')) {
            selectStock(symbol, name);
        } else if (e.target.closest('.remove-from-watchlist')) {
            try {
                await api.removeFromWatchlist(symbol);
                await loadWatchlist();
            } catch (error) {
                console.error(`Failed to remove ${symbol}:`, error);
                alert('Could not remove stock from watchlist.');
            }
        }
    }
    
    async function handleAddToWatchlist(e) {
        if (e.target.id === 'add-to-watchlist-btn' && state.currentSymbol) {
            const btn = e.target;
            if (btn.classList.contains('in-watchlist')) return;

            try {
                await api.addToWatchlist(state.currentSymbol);
                btn.textContent = 'In Watchlist';
                btn.classList.add('in-watchlist');
                btn.disabled = true;
                await loadWatchlist(); 
            } catch (error) {
                console.error(`Failed to add ${state.currentSymbol}:`, error);
                alert('Could not add stock to watchlist.');
            }
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        ui.showFormError('login-form', '');
        try {
            const response = await api.login(username, password);
            localStorage.setItem('token', response.token);
            checkLoginState();
            ui.toggleModal(ui.loginModalEl, false);
            e.target.reset();
        } catch (error) {
            ui.showFormError('login-form', error.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        ui.showFormError('register-form', '');
        try {
            await api.register(username, password);
            ui.toggleModal(ui.registerModalEl, false);
            ui.toggleModal(ui.loginModalEl, true);
            ui.showFormError('login-form', 'Registration successful! Please log in.');
            e.target.reset();
        } catch (error) {
            ui.showFormError('register-form', error.message);
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        state.currentSymbol = null;
        state.isLoggedIn = false;
        state.watchlist = [];
        ui.updateAuthState(false);
        ui.renderWatchlist([]);
        chartManager.setChartData([]);
        ui.companyProfileEl.innerHTML = `<h2>Select a stock to view its profile and chart.</h2>`;
    }

    init();
});