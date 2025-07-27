-- server/models/database.sql
-- This script sets up the PostgreSQL database schema.

-- Users table to store login credentials
-- The password field will store a hashed password, not plaintext.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stocks table to store unique stock symbols and their names
-- This avoids data duplication and serves as a central reference for all stocks in the system.
CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255)
);

-- Join table to create a many-to-many relationship between users and stocks
-- This represents a user's watchlist.
CREATE TABLE user_watchlist_stocks (
    user_id INTEGER NOT NULL,
    stock_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, stock_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
);

-- Add indexes for faster lookups on foreign keys
CREATE INDEX idx_user_watchlist_stocks_user_id ON user_watchlist_stocks(user_id);
CREATE INDEX idx_user_watchlist_stocks_stock_id ON user_watchlist_stocks(stock_id);