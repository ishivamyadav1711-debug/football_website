const passport = require('passport');

/**
 * Google OAuth2 Strategy
 *
 * This is OPTIONAL. The server runs fine without Google credentials.
 * To enable Google Login:
 * 1. Go to https://console.cloud.google.com
 * 2. APIs & Services → Credentials → OAuth Client ID (Web Application)
 * 3. Authorized redirect URI: http://localhost:5000/api/auth/google/callback
 * 4. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const userModel = require('../models/user.model');

  async function generateUniqueUsername(email, displayName) {
    const base = (displayName || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 40);
    let username = base;
    let counter = 1;
    while (await userModel.findByUsername(username)) {
      username = `${base}_${counter++}`;
    }
    return username;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const displayName = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          let user = await userModel.findByGoogleId(googleId);

          if (!user) {
            user = await userModel.findByEmail(email);
            if (user) {
              user = await userModel.linkGoogleAccount(user.id, googleId, avatarUrl);
            } else {
              const username = await generateUniqueUsername(email, displayName);
              user = await userModel.createGoogleUser({ email, googleId, displayName, username, avatarUrl });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  console.log('✅ Google OAuth strategy registered');
} else {
  console.log('ℹ️  Google OAuth skipped (no credentials in .env)');
}

// JWT is stateless — serialize/deserialize are stubs for compatibility
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;
