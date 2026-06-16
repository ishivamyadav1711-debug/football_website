const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const logger = require('../utils/logger');

let io;

/**
 * Initialize Socket.IO server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
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

        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      if (!process.env.JWT_SECRET) {
        logger.fatal('FATAL: JWT_SECRET environment variable is missing.');
        throw new Error('Server configuration error');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      logger.info(`🔐 Socket ${socket.id} authenticated for user_${socket.userId}`);
      next();
    } catch (err) {
      logger.error({ err }, 'Socket authentication failed');
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    // Join Match Room
    socket.on('join_match', (matchId) => {
      socket.join(`match_${matchId}`);
      logger.info(`👤 Client ${socket.id} joined room: match_${matchId}`);
    });

    // Leave Match Room
    socket.on('leave_match', (matchId) => {
      socket.leave(`match_${matchId}`);
      logger.info(`👤 Client ${socket.id} left room: match_${matchId}`);
    });

    // Chat Message Event
    socket.on('chat_message', async (data) => {
      if (!socket.userId) {
        socket.emit('chat_error', { message: 'You must be logged in to chat.' });
        return;
      }
      
      const { matchId, content } = data;
      if (!matchId || !content) return;

      try {
        const query = `
          INSERT INTO match_messages (match_id, user_id, content) 
          VALUES ($1, $2, $3)
          RETURNING id, created_at
        `;
        const result = await pool.query(query, [matchId, socket.userId, content]);

        // Fetch user details for the broadcast
        const userResult = await pool.query('SELECT username, display_name FROM users WHERE id = $1', [socket.userId]);
        const user = userResult.rows[0];

        const chatMessage = {
          id: result.rows[0].id,
          match_id: matchId,
          user_id: socket.userId,
          username: user.username,
          display_name: user.display_name,
          content: content,
          created_at: result.rows[0].created_at
        };

        io.to(`match_${matchId}`).emit('chat_message', chatMessage);
      } catch (err) {
        logger.error({ err }, 'Failed to save chat message');
        socket.emit('chat_error', { message: 'Failed to send message.' });
      }
    });

    // Join Global Live Scores Room
    socket.on('join_live_scores', () => {
      socket.join('live_scores');
      logger.info(`👤 Client ${socket.id} joined room: live_scores`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

/**
 * Get the io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
