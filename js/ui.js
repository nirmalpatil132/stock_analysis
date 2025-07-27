const ui = {
    watchlistEl: document.getElementById('watchlist'),
    searchResultsEl: document.getElementById('search-results'),
    companyProfileEl: document.getElementById('company-profile'),
    loadingIndicatorEl: document.getElementById('loading-indicator'),
    loginModalEl: document.getElementById('login-modal'),
    registerModalEl: document.getElementById('register-modal'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    logoutBtn: document.getElementById('logout-btn'),

    renderWatchlist(stocks) {
        this.watchlistEl.innerHTML = '';
        if (!stocks || stocks.length === 0) {
            this.watchlistEl.innerHTML = '<li>Your watchlist is empty.</li>';
            return;
        }
        stocks.forEach(stock => {
            const li = document.createElement('li');
            li.className = 'watchlist-item';
            li.dataset.symbol = stock.symbol;
            li.dataset.name = stock.name; 
            li.innerHTML = `
                <span class="watchlist-symbol">${stock.symbol}</span>
                <button class="remove-from-watchlist">&times;</button>
            `;
            this.watchlistEl.appendChild(li);
        });
    },

    renderSearchResults(results) {
        this.clearSearchResults();
        if (results.length === 0) return;

        results.forEach(result => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.dataset.symbol = result.symbol;
            div.dataset.name = result.name;
            div.innerHTML = `${result.symbol} <span>${result.name}</span>`;
            this.searchResultsEl.appendChild(div);
        });
        this.searchResultsEl.classList.remove('hidden');
    },

    clearSearchResults() {
        this.searchResultsEl.innerHTML = '';
        this.searchResultsEl.classList.add('hidden');
    },
    
    updateCompanyProfile(profileData, isWatched) {
        this.companyProfileEl.innerHTML = `
            <div>
                <h2>${profileData.name} (${profileData.symbol})</h2>
                <p>Displaying daily historical data. Real-time updates will appear on the chart.</p>
            </div>
            <button id="add-to-watchlist-btn" class="${isWatched ? 'in-watchlist' : ''}" ${isWatched ? 'disabled' : ''}>
                ${isWatched ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
        `;
    },

    toggleLoading(show) {
        this.loadingIndicatorEl.classList.toggle('hidden', !show);
    },

    toggleModal(modalEl, show) {
        if (!modalEl) return;
        if (show) {
            modalEl.classList.remove('hidden');
        } else {
            modalEl.classList.add('hidden');
        }
    },

    showFormError(formId, message) {
        const errorEl = document.querySelector(`#${formId} .error-message`);
        if (errorEl) {
            errorEl.textContent = message;
        }
    },

    updateAuthState(isLoggedIn) {
        this.loginBtn.classList.toggle('hidden', isLoggedIn);
        this.registerBtn.classList.toggle('hidden', isLoggedIn);
        this.logoutBtn.classList.toggle('hidden', !isLoggedIn);
    }
};