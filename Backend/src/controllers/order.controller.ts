import { Request, Response } from 'express';
import * as OrderService from '../services/order.service';
import { successResponse, createdResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError } from '../utils/errors';
import { OrderCreateInput, OrderUpdateInput, OrderListFilters } from '../types/order.types';

/**
 * Order Controller - Handle HTTP requests for orders
 */

/**
 * Create new order
 * POST /api/orders
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const {
    order_type,
    design_name,
    height,
    width,
    unit,
    number_of_colors,
    fabric,
    color_type,
    placement,
    required_format,
    instruction,
    is_urgent,
  } = req.body;

  // Validation
  const errors: any = {};

  if (!order_type || !['DIGITIZING', 'VECTOR', 'PATCHES'].includes(order_type)) {
    errors.order_type = 'Valid order type is required (DIGITIZING, VECTOR, PATCHES)';
  }

  if (!design_name || design_name.trim().length === 0) {
    errors.design_name = 'Design name is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const orderData: OrderCreateInput = {
    order_type,
    design_name: design_name.trim(),
    height,
    width,
    unit,
    number_of_colors,
    fabric,
    color_type,
    placement,
    required_format,
    instruction,
    is_urgent: is_urgent ? 1 : 0,
  };

  const order = await OrderService.createOrder(req.user.userId, orderData);

  return createdResponse(res, 'Order created successfully', order);
});

/**
 * Get all orders with filters
 * GET /api/orders
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const filters: OrderListFilters = {
    order_type: req.query.order_type as any,
    status: req.query.status as any,
    is_urgent: req.query.is_urgent ? parseInt(req.query.is_urgent as string) : undefined,
    search: req.query.search as string,
    from_date: req.query.from_date as string,
    to_date: req.query.to_date as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const result = await OrderService.getOrders(
    filters,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Orders retrieved successfully', result);
});

/**
 * Get current user's orders
 * GET /api/orders/my-orders
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orders = await OrderService.getUserOrders(req.user.userId);

  return successResponse(res, 'Your orders retrieved successfully', orders);
});

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await OrderService.getOrderById(
    orderId,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Order retrieved successfully', order);
});

/**
 * Get order by order number
 * GET /api/orders/number/:orderNo
 */
export const getOrderByOrderNo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { orderNo } = req.params;

    if (!orderNo || orderNo.trim().length === 0) {
      throw new ValidationError('Order number is required');
    }

    const order = await OrderService.getOrderByOrderNo(
      orderNo,
      req.user.userId,
      req.user.role
    );

    return successResponse(res, 'Order retrieved successfully', order);
  }
);

/**
 * Update order
 * PUT /api/orders/:id
 */
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const {
    design_name,
    height,
    width,
    unit,
    number_of_colors,
    fabric,
    color_type,
    placement,
    required_format,
    instruction,
    is_urgent,
    status,
  } = req.body;

  const updateData: OrderUpdateInput = {
    design_name,
    height,
    width,
    unit,
    number_of_colors,
    fabric,
    color_type,
    placement,
    required_format,
    instruction,
    is_urgent,
    status,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof OrderUpdateInput] === undefined) {
      delete updateData[key as keyof OrderUpdateInput];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('No update data provided');
  }

  const order = await OrderService.updateOrder(
    orderId,
    updateData,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Order updated successfully', order);
});

/**
 * Update order status (Admin only)
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      throw new ValidationError('Invalid order ID');
    }

    const { status } = req.body;

    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new ValidationError(
        'Valid status is required (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)'
      );
    }

    const order = await OrderService.updateOrderStatus(
      orderId,
      status,
      req.user.role
    );

    return successResponse(res, 'Order status updated successfully', order);
  }
);

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await OrderService.cancelOrder(
    orderId,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Order cancelled successfully', order);
});

/**
 * Delete order (Admin only)
 * DELETE /api/orders/:id
 */
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  await OrderService.deleteOrder(orderId, req.user.userId, req.user.role);

  return successResponse(res, 'Order deleted successfully');
});
