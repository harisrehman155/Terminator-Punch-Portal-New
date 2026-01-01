import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { asyncHandler } from './error.middleware';

/**
 * Check if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    }
  );
};

/**
 * Require USER role
 */
export const requireUser = requireRole(['USER']);

/**
 * Require ADMIN role
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Require USER or ADMIN role
 */
export const requireUserOrAdmin = requireRole(['USER', 'ADMIN']);
