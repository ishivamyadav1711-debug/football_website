/**
 * Global error handling middleware
 * Always the LAST middleware registered in Express
 */
const errorMiddleware = (err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else {
    console.error(`❌ ${err.message}`);
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use`,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details.map((d) => d.message),
    });
  }

  // Default 500 error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An internal server error occurred' : err.message,
  });
};

module.exports = errorMiddleware;
