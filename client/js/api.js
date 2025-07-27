class ApiService {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return response.status === 204 ? {} : response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    }

    login(username, password) {
        return this._request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    register(username, password) {
        return this._request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    searchStocks(query) {
        return this._request(`/api/watchlist/search?query=${encodeURIComponent(query)}`);
    }

    getHistoricalData(symbol) {
        return this._request(`/api/watchlist/historical/${symbol}`);
    }

    getWatchlist() {
        return this._request('/api/watchlist');
    }

    addToWatchlist(symbol) {
        return this._request('/api/watchlist', {
            method: 'POST',
            body: JSON.stringify({ symbol }),
        });
    }

    removeFromWatchlist(symbol) {
        return this._request(`/api/watchlist/${symbol}`, {
            method: 'DELETE',
        });
    }
}

const api = new ApiService();