import { Response } from 'express';

/**
 * Standard API response structure
 */
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
}

/**
 * Paginated response structure
 */
interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send success response
 */
export const successResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const errorResponse = (
  res: Response,
  message: string,
  errors?: any,
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    status: 'error',
    message,
    errors,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const paginatedResponse = <T = any>(
  res: Response,
  message: string,
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  statusCode: number = 200
): Response => {
  const response: PaginatedResponse<T> = {
    status: 'success',
    message,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const createdResponse = <T = any>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return successResponse(res, message, data, 201);
};

/**
 * Send no content response (204)
 */
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Send unauthorized response (401)
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return errorResponse(res, message, null, 401);
};

/**
 * Send forbidden response (403)
 */
export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return errorResponse(res, message, null, 403);
};

/**
 * Send not found response (404)
 */
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, message, null, 404);
};

/**
 * Send validation error response (422)
 */
export const validationErrorResponse = (
  res: Response,
  errors: any,
  message: string = 'Validation failed'
): Response => {
  return errorResponse(res, message, errors, 422);
};

/**
 * Send internal server error response (500)
 */
export const serverErrorResponse = (
  res: Response,
  message: string = 'Internal server error'
): Response => {
  return errorResponse(res, message, null, 500);
};
