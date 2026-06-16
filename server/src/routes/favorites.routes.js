const express = require('express');
const favoritesController = require('../controllers/favorites.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', verifyAccessToken, favoritesController.addFavorite);
router.delete('/', verifyAccessToken, favoritesController.removeFavorite);
router.get('/', verifyAccessToken, favoritesController.getFavorites);

module.exports = router;
