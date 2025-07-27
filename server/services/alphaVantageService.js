const fetch = require('node-fetch');

const API_KEY = "DzNzprCxUplY4CPOVHAPSupzLWR_mJzs";
const BASE_URL = 'https://api.polygon.io';

const activePollers = new Map();

function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

async function searchSymbol(query) {
    try {
        const url = `${BASE_URL}/v3/reference/tickers?search=${query}&active=true&limit=10&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results ? data.results.map(match => ({
            symbol: match.ticker,
            name: match.name
        })) : [];
    } catch (error) {
        console.error('Error in searchSymbol:', error);
        throw error;
    }
}

async function getHistoricalData(symbol) {
    try {
        const today = new Date();
        const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));
        const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${getFormattedDate(oneYearAgo)}/${getFormattedDate(today)}?adjusted=true&sort=asc&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results) {
            throw new Error('Could not load data for this stock.');
        }

        return data.results.map(bar => ({
            time: getFormattedDate(new Date(bar.t)),
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
        }));
    } catch (error) {
        console.error(`Error in getHistoricalData for ${symbol}:`, error);
        throw error;
    }
}

async function getLatestQuote(symbol) {
    try {
        const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        const quote = data.results[0];
        return {
            symbol: data.ticker,
            time: getFormattedDate(new Date(quote.t)),
            open: quote.o,
            high: quote.h,
            low: quote.l,
            close: quote.c,
        };
    } catch (error) {
        console.error(`Error fetching latest quote for ${symbol}:`, error);
        return null;
    }
}

function startPolling(symbol, broadcastCallback) {
    if (activePollers.has(symbol)) {
        return;
    }
    const intervalId = setInterval(async () => {
        const data = await getLatestQuote(symbol);
        if (data) {
            broadcastCallback(symbol, data);
        }
    }, 65000); 

    activePollers.set(symbol, intervalId);
}

function stopPolling(symbol) {
    if (activePollers.has(symbol)) {
        clearInterval(activePollers.get(symbol));
        activePollers.delete(symbol);
    }
}

module.exports = {
    searchSymbol,
    getHistoricalData,
    startPolling,
    stopPolling
};