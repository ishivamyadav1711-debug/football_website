const express = require('express');
const newsController = require('../controllers/news.controller');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

router.get('/', cacheMiddleware(60), newsController.getTrendingNews);

module.exports = router;
