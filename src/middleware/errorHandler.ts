import { Request, Response, NextFunction } from 'express';

/**
 * Custom error interface that allows for status code specification
 */
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  data?: any;
}

/**
 * Standard error response structure
 */
interface ErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  code?: string;
  data?: any;
}

/**
 * Centralized error handling middleware for Express
 * 
 * This middleware captures all errors thrown in route handlers and provides
 * a standardized JSON response to the client. It also logs error details
 * for debugging purposes.
 * 
 * @param err - The error object thrown in the route handler
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details for debugging
  console.error('❌ Error occurred:', err.message);
  if (err.stack) {
    console.error('Stack trace:', err.stack);
  }

  // Determine appropriate status code
  const statusCode = (err as AppError).statusCode || 500;
  
  // Create standardized error response
  const errorResponse: ErrorResponse = {
    status: 'error',
    statusCode: statusCode,
    message: err.message || 'Internal Server Error'
  };
  
  // Add optional error code if present
  if ((err as AppError).code) {
    errorResponse.code = (err as AppError).code;
  }
  
  // Add additional error data if present
  if ((err as AppError).data) {
    errorResponse.data = (err as AppError).data;
  }

  // Send standardized error response
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
