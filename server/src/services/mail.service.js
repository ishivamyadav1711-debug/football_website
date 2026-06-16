const nodemailer = require('nodemailer');

/**
 * Mail Service — Nodemailer-based transactional email
 * In development (NODE_ENV=development), emails are logged to console
 * In production, configure a real SMTP provider
 */

let transporter;

/**
 * Initialize the mail transporter
 * Uses Ethereal (fake SMTP) in dev for zero-config testing
 * Uses SMTP credentials in production
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    // Use Ethereal fake SMTP for development (no credentials needed)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal fake SMTP for development');
    console.log(`   Preview emails at: https://ethereal.email`);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

/**
 * Base HTML email template — PitchLive branded
 */
const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0F172A; color: #F8FAFC; }
    .container { max-width: 560px; margin: 40px auto; background: #1E293B; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px; text-align: center; border-bottom: 1px solid rgba(34,197,94,0.3); }
    .logo { font-size: 28px; font-weight: 800; color: #22C55E; letter-spacing: -0.5px; }
    .logo span { color: #F8FAFC; }
    .body { padding: 40px 32px; }
    h1 { font-size: 22px; font-weight: 700; color: #F8FAFC; margin-bottom: 16px; }
    p { color: #94A3B8; line-height: 1.7; margin-bottom: 16px; font-size: 15px; }
    .btn { display: inline-block; background: #22C55E; color: #0F172A; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 24px 0; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }
    .footer { padding: 24px 32px; text-align: center; }
    .footer p { color: #475569; font-size: 12px; }
    .link-fallback { color: #22C55E; font-size: 13px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Score<span>X</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>PitchLive Sports Analytics · All rights reserved</p>
      <p style="margin-top:8px">If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send a welcome email to a newly registered user
 */
const sendWelcomeEmail = async (user) => {
  const transport = await getTransporter();

  const content = `
    <h1>Welcome to PitchLive! 🏆</h1>
    <p>Hey <strong>${user.display_name || user.username}</strong>,</p>
    <p>Your account has been created successfully. You're now part of the PitchLive community — live scores, analytics, and predictions all in one place.</p>
    <p>Start exploring:</p>
    <a href="${process.env.CLIENT_URL}" class="btn">Open PitchLive →</a>
    <hr class="divider">
    <p><strong>Username:</strong> ${user.username}</p>
    <p><strong>Email:</strong> ${user.email}</p>
  `;

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'PitchLive <noreply@PitchLive.app>',
    to: user.email,
    subject: 'Welcome to PitchLive! 🏆',
    html: emailTemplate('Welcome to PitchLive', content),
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 Welcome email sent → ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

/**
 * Send a password reset email with a secure time-limited link
 */
const sendPasswordResetEmail = async (user, rawToken) => {
  const transport = await getTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password.html?token=${rawToken}`;

  const content = `
    <h1>Reset Your Password</h1>
    <p>Hey <strong>${user.display_name || user.username || user.email}</strong>,</p>
    <p>We received a request to reset your PitchLive account password. Click the button below to set a new password.</p>
    <a href="${resetUrl}" class="btn">Reset Password →</a>
    <hr class="divider">
    <p><strong>⏰ This link expires in 1 hour.</strong></p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p class="link-fallback">${resetUrl}</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'PitchLive <noreply@PitchLive.app>',
    to: user.email,
    subject: 'Reset your PitchLive password',
    html: emailTemplate('Reset Your Password', content),
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 Password reset email sent → ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
  }

  return info;
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };

