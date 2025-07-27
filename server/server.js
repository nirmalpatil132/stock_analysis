// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config({ path: './.env' });

const authRoutes = require('./routes/authRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO and pass it to the service
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your client's URL
    methods: ["GET", "POST"]
  }
});
socketService.initialize(io);

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.static('client'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Simple root route to confirm server is running
app.get('/', (req, res) => {
  res.send('Stock Analysis Server is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});