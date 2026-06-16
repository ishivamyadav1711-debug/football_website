const express = require('express');
const teamController = require('../controllers/team.controller');

const router = express.Router();

router.get('/:id', teamController.getTeamDetails);

module.exports = router;
