require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const { testConnection, runMigrations } = require('./config/db');
const { apiRateLimiter } = require('./middleware/rateLimiter.middleware');
const errorMiddleware = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const matchRoutes = require('./routes/match.routes');
const teamRoutes = require('./routes/team.routes');
const playerRoutes = require('./routes/player.routes');
const leagueRoutes = require('./routes/league.routes');
const fixturesRoutes = require('./routes/fixtures.routes');
const searchRoutes = require('./routes/search.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const newsRoutes = require('./routes/news.routes');
const predictionsRoutes = require('./routes/predictions.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const adminRoutes = require('./routes/admin.routes');
const streamsRoutes = require('./routes/streams.routes');
const chatRoutes = require('./routes/chat.routes');
const { startSimulation } = require('./services/simulation.service');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://cdn.sportmonks.com", "https://i.pravatar.cc", "https://images.unsplash.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'same-origin' },
}));

// Accept all common local development origins
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://localhost:8080',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// Body Parsing Middleware
// ============================================================
app.use(express.json({ limit: '10kb' })); // Prevent payload bombs
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// Passport (Google OAuth)
// ============================================================
app.use(passport.initialize());

// ============================================================
// Rate Limiting (global API limiter)
// ============================================================
app.use('/api', apiRateLimiter);

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/fixtures', fixturesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/streams', streamsRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PitchLive Auth API',
    version: '1.0.0',
  });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../');
  app.use(express.static(frontendPath));
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // 404 handler for unknown routes (dev mode)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.url} not found`,
    });
  });
}

// ============================================================
// Global Error Handler (must be last)
// ============================================================
app.use(errorMiddleware);

const http = require('http');
const { initSocket } = require('./services/socket.service');

// ============================================================
// Start Server
// ============================================================
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start the real-time match simulation
startSimulation();

const start = async () => {
  try {
    // Test DB connection and run migrations before accepting traffic
    await testConnection();
    await runMigrations();

    server.listen(PORT, () => {
      logger.info(`🚀 PitchLive API Server running on http://localhost:${PORT}`);
      logger.info(`📋 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      logger.info(`👤 Users API: http://localhost:${PORT}/api/users`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    // Don't exit process if we are on Vercel
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

if (!process.env.VERCEL) {
  start();
}

module.exports = app;

