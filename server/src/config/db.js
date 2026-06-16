const { Pool } = require('pg');

/**
 * PostgreSQL connection pool
 * Uses Neon serverless Postgres via DATABASE_URL
 * SSL is required for Neon connections
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // 15s for Neon cold start
});

/**
 * Test the database connection on startup, with retry for Neon cold starts
 */
const testConnection = async (retries = 3) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected successfully');
      client.release();
      return;
    } catch (err) {
      if (i === retries) {
        console.error('❌ PostgreSQL connection failed after retries:', err.message);
        console.warn('⚠️ Server will continue running without DB, some features may be broken.');
        return; // Don't crash
      }
      console.log(`⏳ DB connection attempt ${i}/${retries} failed, retrying in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};

/**
 * Run database migrations: create all required tables if they don't exist.
 * Idempotent — safe to run on every server start.
 */
const runMigrations = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('🔄 Running database migrations...');

    await client.query(`
      -- Enable UUID generation
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Custom Enums (idempotent with DO blocks)
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- ============================================================
      -- USERS TABLE
      -- ============================================================
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        username VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100),
        avatar_url TEXT,
        google_id VARCHAR(255) UNIQUE,
        email_verified BOOLEAN DEFAULT FALSE NOT NULL,
        role user_role DEFAULT 'user' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Auto-update updated_at trigger
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- ============================================================
      -- REFRESH TOKENS TABLE (multi-device session management)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        device_info TEXT,
        ip_address INET,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked = FALSE;

      -- ============================================================
      -- PASSWORD RESET TOKENS TABLE (1-hour TTL, single-use)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash) WHERE used = FALSE;

      -- Users performance indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

      -- ============================================================
      -- USER FAVORITES TABLE (For personalized dashboard)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS user_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL, -- 'team', 'player', 'league'
        entity_id VARCHAR(50) NOT NULL,   -- e.g., '1', 'PL', '107'
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(user_id, entity_type, entity_id)
      );

      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorites(user_id);

      -- ============================================================
      -- PREDICTION VOTES TABLE (Community Voting System)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS prediction_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        match_id VARCHAR(50) NOT NULL,
        vote VARCHAR(10) CHECK (vote IN ('home', 'draw', 'away')) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(user_id, match_id)
      );

      CREATE INDEX IF NOT EXISTS idx_prediction_votes_match_id_vote ON prediction_votes(match_id, vote);

      -- ============================================================
      -- NOTIFICATIONS TABLE (Real-time and persistent alerts)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'match_start', 'goal', 'match_end', 'news', 'transfer'
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

      -- ============================================================
      -- MATCH STREAMS TABLE (Live Streaming Aggregator)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS match_streams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id VARCHAR(50) NOT NULL, -- e.g., 'm_12345' or simple match identifier
        source_name VARCHAR(100) NOT NULL, -- e.g., 'Stream 1 (HD EN)'
        url VARCHAR(500) NOT NULL,
        language VARCHAR(50) DEFAULT 'EN',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_match_streams_match_id ON match_streams(match_id) WHERE is_active = TRUE;

      -- ============================================================
      -- MATCH MESSAGES TABLE (Live Chat Rooms)
      -- ============================================================
      CREATE TABLE IF NOT EXISTS match_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id VARCHAR(50) NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_match_messages_match_id ON match_messages(match_id);
    `);

    console.log('✅ Database migrations complete');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    // Don't throw err, so app can start without DB
  } finally {
    if (client) client.release();
  }
};

/**
 * Convenience query helper
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, testConnection, runMigrations };
