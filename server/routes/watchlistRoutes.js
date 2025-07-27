const express = require('express');
const watchlistController = require('../controllers/watchlistController');
const { authenticateToken } = require('../controllers/authController');
const router = express.Router();

router.use(authenticateToken);

router.get('/', watchlistController.getWatchlist);
router.post('/', watchlistController.addToWatchlist);
router.delete('/:symbol', watchlistController.removeFromWatchlist);
router.get('/search', watchlistController.searchStock);
router.get('/historical/:symbol', watchlistController.getHistoricalData);

module.exports = router;