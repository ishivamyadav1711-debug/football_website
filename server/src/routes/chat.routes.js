const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Fetch history for a match. Open to public so they see what they're missing, or restricted?
// Let's make it public so lurkers can read the chat, but they must sign in to send messages (enforced via socket).
router.get('/:matchId/history', chatController.getMatchHistory);

module.exports = router;
