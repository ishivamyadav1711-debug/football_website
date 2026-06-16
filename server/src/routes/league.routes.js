const express = require('express');
const leagueController = require('../controllers/league.controller');

const router = express.Router();

router.get('/:id', leagueController.getLeagueDetails);

module.exports = router;
