const express = require('express');
const matchController = require('../controllers/match.controller');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

router.get('/live', cacheMiddleware(5), matchController.getLiveMatches);
router.get('/:id', cacheMiddleware(5), matchController.getMatchDetails);

module.exports = router;
