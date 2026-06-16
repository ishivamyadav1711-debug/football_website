const express = require('express');
const router = express.Router();
const predictionsController = require('../controllers/predictions.controller');
const { verifyAccessToken, optionalAuth } = require('../middleware/auth.middleware');

// Get prediction (optional auth to return user's previous vote if logged in)
router.get('/:matchId', optionalAuth, predictionsController.getPrediction);

// Submit a vote (requires auth)
router.post('/:matchId/vote', verifyAccessToken, predictionsController.submitVote);

module.exports = router;
