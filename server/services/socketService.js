const alphaVantageService = require('./alphaVantageService');

const watchedTickers = new Map();
let ioInstance = null;

function broadcastUpdate(symbol, data) {
    if (ioInstance && watchedTickers.has(symbol)) {
        ioInstance.to(symbol).emit('stock_update', data);
    }
}

function initialize(io) {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`A user connected: ${socket.id}`);

        socket.on('subscribe', ({ symbol }) => {
            console.log(`Socket ${socket.id} subscribed to ${symbol}`);
            socket.join(symbol);

            if (!watchedTickers.has(symbol)) {
                watchedTickers.set(symbol, new Set());
            }
            watchedTickers.get(symbol).add(socket.id);

            if (watchedTickers.get(symbol).size === 1) {
                alphaVantageService.startPolling(symbol, broadcastUpdate);
            }
        });

        socket.on('unsubscribe', (symbol) => {
            console.log(`Socket ${socket.id} unsubscribed from ${symbol}`);
            socket.leave(symbol);

            if (watchedTickers.has(symbol)) {
                const subscribers = watchedTickers.get(symbol);
                subscribers.delete(socket.id);

                if (subscribers.size === 0) {
                    watchedTickers.delete(symbol);
                    alphaVantageService.stopPolling(symbol);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            watchedTickers.forEach((subscribers, symbol) => {
                if (subscribers.has(socket.id)) {
                    subscribers.delete(socket.id);
                    if (subscribers.size === 0) {
                        watchedTickers.delete(symbol);
                        alphaVantageService.stopPolling(symbol);
                    }
                }
            });
        });
    });
}

module.exports = { initialize };