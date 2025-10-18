/**
 * Request logging middleware
 * Logs HTTP requests with method, URL, status code, and response time
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 500 ? '🔴'
      : res.statusCode >= 400 ? '🟠'
      : res.statusCode >= 300 ? '🟡'
      : '🟢';

    console.log(
      `${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );

    // Log body for non-GET requests in development
    if (process.env.NODE_ENV === 'development' && req.method !== 'GET' && Object.keys(req.body).length > 0) {
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
  });

  next();
};

module.exports = requestLogger;
