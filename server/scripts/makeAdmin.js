require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../src/config/db');

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide the user email address.');
    console.error('Usage: node scripts/makeAdmin.js <user_email>');
    process.exit(1);
  }

  try {
    const client = await pool.connect();
    
    // Check if user exists
    const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    // Elevate role
    await client.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
    console.log(`✅ Success! User ${email} has been elevated to ADMIN.`);
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database error:', err);
    process.exit(1);
  }
};

makeAdmin();
