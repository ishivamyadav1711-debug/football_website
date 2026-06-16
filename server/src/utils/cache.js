/**
 * Simple In-Memory Cache for High-Traffic Endpoints
 * Use this to alleviate database/simulation load under 100k+ concurrent users.
 */
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 10, checkperiod: 12 }); // Default 10 seconds TTL

const cacheMiddleware = (duration) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl;
  const cachedResponse = myCache.get(key);

  if (cachedResponse) {
    return res.json(cachedResponse);
  } else {
    // Override res.json to cache the response before sending it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      myCache.set(key, body, duration);
      originalJson(body);
    };
    next();
  }
};

module.exports = { myCache, cacheMiddleware };
