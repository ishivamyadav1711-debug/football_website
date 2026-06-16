const axios = require('axios');
const { createClient } = require('redis');
const logger = require('../utils/logger'); // assuming a logger exists based on app.js

const API_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const apiClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': API_HOST,
  },
});

let redisClient;
let isRedisConnected = false;

// Initialize Redis
(async () => {
  try {
    redisClient = createClient({ url: REDIS_URL });
    
    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis Client Error in api-football.service.js');
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis Connected for API-Football Caching');
      isRedisConnected = true;
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed. Running API-Football without cache.', error);
    isRedisConnected = false;
  }
})();

/**
 * Fetch data from API-Football with Redis caching
 * @param {string} endpoint - The API endpoint (e.g., '/fixtures')
 * @param {object} params - Query parameters
 * @param {number} ttlSeconds - Cache time-to-live in seconds
 * @returns {Promise<any>}
 */
const fetchFromApiWithCache = async (endpoint, params = {}, ttlSeconds = 300) => {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('API_FOOTBALL_KEY is not configured in .env');
  }

  try {
    const cacheKey = `api-football:${endpoint}:${JSON.stringify(params)}`;
    
    if (isRedisConnected) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const response = await apiClient.get(endpoint, { params });
    const data = response.data;

    // Check if API limit reached or other API errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      logger.error({ endpoint, params, errors: data.errors }, 'API-Football returned an error');
      // Do not cache error responses
      return data;
    }

    // Cache successful responses
    if (isRedisConnected) {
      await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    logger.error({ endpoint, params, error: error.message }, 'Error fetching from API-Football');
    throw error;
  }
};

module.exports = {
  fetchFromApiWithCache
};
