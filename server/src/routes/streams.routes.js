const express = require('express');
const router = express.Router();
const streamsController = require('../controllers/streams.controller');
const { verifyAccessToken, requireRole } = require('../middleware/auth.middleware');

// Public/Registered users can view streams for a match
// We require a token to view streams to drive signups!
router.get('/:matchId', verifyAccessToken, streamsController.getStreamsByMatchId);

// Admin only: Add a new stream
router.post('/', verifyAccessToken, requireRole('admin'), streamsController.addStream);

module.exports = router;
