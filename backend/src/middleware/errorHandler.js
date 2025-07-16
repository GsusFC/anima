/**
 * Centralized error handling middleware for Express
 * 
 * This middleware captures all errors thrown in route handlers and provides
 * a standardized JSON response to the client. It also logs error details
 * for debugging purposes.
 */

const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('Error occurred:', err.message);
  if (err.stack) {
    console.error('Stack trace:', err.stack);
  }

  // Determine appropriate status code
  const statusCode = err.statusCode || 500;

  // Send standardized error response
  res.status(statusCode).json({
    status: 'error',
    statusCode: statusCode,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
