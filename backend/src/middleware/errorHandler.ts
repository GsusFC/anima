/**
 * AnimaGen Backend - Error Handler Middleware
 * 
 * This middleware provides centralized error handling for the AnimaGen backend application.
 * It handles different types of errors, logs them appropriately, and sends standardized
 * responses to clients.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  ErrorType, 
  AppError, 
  ErrorHandlerMiddleware,
  ErrorHandlerOptions
} from '../types';
import { logError } from '../utils';
import config from '../config';

/**
 * Default error handler options
 */
const defaultOptions: ErrorHandlerOptions = {
  logToConsole: true,
  logToFile: config.isProduction(),
  sendToClient: true
};

/**
 * Creates an AppError from any error object
 * @param err Error object
 * @returns AppError object
 */
function normalizeError(err: Error | AppError): AppError {
  // If it's already an AppError, return it
  if ('type' in err && 'statusCode' in err && 'isOperational' in err) {
    return err as AppError;
  }

  // Otherwise, create a new AppError
  const appError = err as Partial<AppError>;
  
  // Determine error type and status code based on error message or instance
  if (err.name === 'ValidationError' || err.message.includes('validation')) {
    appError.type = ErrorType.VALIDATION;
    appError.statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.message.includes('unauthorized') || err.message.includes('authentication')) {
    appError.type = ErrorType.AUTHORIZATION;
    appError.statusCode = 401;
  } else if (err.name === 'NotFoundError' || err.message.includes('not found')) {
    appError.type = ErrorType.NOT_FOUND;
    appError.statusCode = 404;
  } else if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
    appError.type = ErrorType.TIMEOUT;
    appError.statusCode = 408;
  } else {
    appError.type = ErrorType.INTERNAL;
    appError.statusCode = 500;
  }
  
  // Default to operational error for known types, programming error for unknown
  appError.isOperational = appError.type !== ErrorType.INTERNAL;
  
  return appError as AppError;
}

/**
 * Formats error for client response
 * @param err AppError object
 * @param includeDetails Whether to include error details in response
 * @returns Formatted error object for client
 */
function formatErrorForClient(err: AppError, includeDetails: boolean = !config.isProduction()): Record<string, any> {
  const response: Record<string, any> = {
    success: false,
    error: err.message || 'An unexpected error occurred',
    statusCode: err.statusCode
  };
  
  // Include error type in development mode
  if (!config.isProduction()) {
    response.type = err.type;
  }
  
  // Include stack trace and details in development mode or if explicitly requested
  if (includeDetails) {
    if (err.details) {
      response.details = err.details;
    }
    
    if (!config.isProduction()) {
      response.stack = err.stack;
    }
  }
  
  return response;
}

/**
 * Error handler middleware
 * @param options Error handler options
 * @returns Express error handler middleware
 */
export function createErrorHandler(options: ErrorHandlerOptions = defaultOptions): ErrorHandlerMiddleware {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return (err: Error | AppError, req: Request, res: Response, next: NextFunction): void => {
    // Normalize error
    const normalizedError = normalizeError(err);
    
    // Log error
    if (mergedOptions.logToConsole) {
      const source = `${req.method} ${req.originalUrl}`;
      logError(normalizedError, source);
    }
    
    // Send response if headers not sent yet
    if (mergedOptions.sendToClient && !res.headersSent) {
      const statusCode = normalizedError.statusCode || 500;
      const errorResponse = formatErrorForClient(normalizedError);
      
      res.status(statusCode).json(errorResponse);
    } else if (!res.headersSent) {
      // If we're not supposed to send to client but headers aren't sent, send generic error
      res.status(500).json({
        success: false,
        error: 'An unexpected error occurred'
      });
    }
    
    // If it's a programming error (not operational), log it more prominently
    if (!normalizedError.isOperational) {
      console.error('💥 PROGRAMMING ERROR: This needs to be fixed by a developer');
      console.error(normalizedError);
      
      // In production, we might want to restart the process or notify developers
      if (config.isProduction()) {
        // This would be a good place to send an alert to your error monitoring service
        // e.g., Sentry, New Relic, etc.
        console.error('🔔 This error should be reported to the development team');
      }
    }
    
    // Don't call next() as this is the final error handler
  };
}

/**
 * Default error handler middleware instance
 */
const errorHandler: ErrorHandlerMiddleware = createErrorHandler();

export default errorHandler;
