import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

/**
 * Admin Routes
 * All routes require authentication and admin role
 */

/**
 * GET /api/admin/users
 * Get all users (Admin only)
 */
router.get('/users', authenticate, requireAdmin, AdminController.getAllUsers);

/**
 * GET /api/admin/users/:id
 * Get user by ID (Admin only)
 */
router.get('/users/:id', authenticate, requireAdmin, AdminController.getUserById);

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Toggle user active status (Admin only)
 */
router.patch(
  '/users/:id/toggle-status',
  authenticate,
  requireAdmin,
  AdminController.toggleUserStatus
);

/**
 * GET /api/admin/stats
 * Get system statistics (Admin only)
 */
router.get('/stats', authenticate, requireAdmin, AdminController.getSystemStats);

/**
 * GET /api/admin/orders
 * Get all orders (Admin only)
 */
router.get('/orders', authenticate, requireAdmin, AdminController.getAllOrders);

/**
 * GET /api/admin/quotes
 * Get all quotes (Admin only)
 */
router.get('/quotes', authenticate, requireAdmin, AdminController.getAllQuotes);

export default router;
