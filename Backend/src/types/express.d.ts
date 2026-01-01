import { Request } from 'express';

/**
 * Extend Express Request interface to include user data from JWT
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

export {};
