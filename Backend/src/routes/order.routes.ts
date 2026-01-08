import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

/**
 * Order Routes
 * All routes require authentication
 */

/**
 * POST /api/orders
 * Create new order (User & Admin)
 */
router.post('/', authenticate, OrderController.createOrder);

/**
 * GET /api/orders
 * Get all orders with filters (User sees own, Admin sees all)
 */
router.get('/', authenticate, OrderController.getOrders);

/**
 * GET /api/orders/my-orders
 * Get current user's orders
 */
router.get('/my-orders', authenticate, OrderController.getMyOrders);

/**
 * GET /api/orders/number/:orderNo
 * Get order by order number
 * Note: This must be before /:id to avoid conflicts
 */
router.get('/number/:orderNo', authenticate, OrderController.getOrderByOrderNo);

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/:id', authenticate, OrderController.getOrderById);

/**
 * PUT /api/orders/:id
 * Update order (User can update own, Admin can update all)
 */
router.put('/:id', authenticate, OrderController.updateOrder);

/**
 * PATCH /api/orders/:id/status
 * Update order status (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  OrderController.updateOrderStatus
);

/**
 * POST /api/orders/:id/cancel
 * Cancel order (User can cancel own, Admin can cancel all)
 */
router.post('/:id/cancel', authenticate, OrderController.cancelOrder);

/**
 * DELETE /api/orders/:id
 * Delete order (User can delete own, Admin can delete all)
 */
router.delete('/:id', authenticate, OrderController.deleteOrder);

export default router;
