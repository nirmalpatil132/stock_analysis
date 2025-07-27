const { Pool } = require('pg');
const alphaVantageService = require('../services/alphaVantageService');

const pool = new Pool({ connectionString: "postgresql://postgres:Password%40132@localhost:5432/stock_db" });

exports.searchStock = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: "Search query is required." });
    }
    try {
        const results = await alphaVantageService.searchSymbol(query);
        res.json(results);
    } catch (error) {
        console.error('Stock search error:', error);
        res.status(500).json({ message: "Error searching for stock." });
    }
};

exports.getHistoricalData = async (req, res) => {
    const { symbol } = req.params;
    try {
        const data = await alphaVantageService.getHistoricalData(symbol.toUpperCase());
        res.json({ symbol: symbol.toUpperCase(), data });
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({ message: "Error fetching historical data." });
    }
};

exports.getWatchlist = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.symbol, s.name FROM stocks s
             JOIN user_watchlist_stocks uws ON s.id = uws.stock_id
             WHERE uws.user_id = $1 ORDER BY s.symbol`,
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting watchlist:', error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.addToWatchlist = async (req, res) => {
    const { symbol } = req.body;
    const userId = req.user.userId;

    if (!symbol) {
        return res.status(400).json({ message: "Stock symbol is required." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let stockResult = await client.query('SELECT id FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);
        let stockId;

        if (stockResult.rows.length === 0) {
            const searchResults = await alphaVantageService.searchSymbol(symbol.toUpperCase());
            const stockName = searchResults.length > 0 ? searchResults[0].name : 'N/A';
            const newStockResult = await client.query(
                'INSERT INTO stocks (symbol, name) VALUES ($1, $2) RETURNING id',
                [symbol.toUpperCase(), stockName]
            );
            stockId = newStockResult.rows[0].id;
        } else {
            stockId = stockResult.rows[0].id;
        }

        await client.query(
            'INSERT INTO user_watchlist_stocks (user_id, stock_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, stockId]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: "Stock added to watchlist." });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        client.release();
    }
};

exports.removeFromWatchlist = async (req, res) => {
    const { symbol } = req.params;
    const userId = req.user.userId;

    try {
        const stockResult = await pool.query('SELECT id FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);
        if (stockResult.rows.length === 0) {
            return res.status(404).json({ message: "Stock not found." });
        }
        const stockId = stockResult.rows[0].id;

        await pool.query(
            'DELETE FROM user_watchlist_stocks WHERE user_id = $1 AND stock_id = $2',
            [userId, stockId]
        );

        res.json({ message: "Stock removed from watchlist." });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.status(500).json({ message: "Internal server error." });
    }
};