import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Determine the status code
  const statusCode = err.statusCode || 500;

  // Prepare the error response
  const errorResponse = {
    error: {
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      status: statusCode,
    },
  };

  // Add stack trace in development environment
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
};
