import * as OrderModel from '../models/order.model';
import {
  Order,
  OrderCreateInput,
  OrderUpdateInput,
  OrderListFilters,
  OrderResponse,
} from '../types/order.types';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';

/**
 * Order Service - Business logic for orders
 */

/**
 * Create a new order
 */
export const createOrder = async (
  userId: number,
  orderData: OrderCreateInput
): Promise<OrderResponse> => {
  // Validate order type specific fields
  validateOrderTypeFields(orderData);

  const order = await OrderModel.create(userId, orderData);

  return OrderModel.toOrderResponse(order);
};

/**
 * Get order by ID
 * Users can only view their own orders, admins can view all
 */
export const getOrderById = async (
  orderId: number,
  userId: number,
  userRole: string
): Promise<OrderResponse> => {
  const order = await OrderModel.findByIdWithUser(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only view their own orders
  if (userRole !== 'ADMIN' && order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  return {
    ...OrderModel.toOrderResponse(order),
    user: {
      id: order.user_id,
      name: order.user_name,
      email: order.user_email,
      company: order.user_company,
    },
  };
};

/**
 * Get order by order number
 */
export const getOrderByOrderNo = async (
  orderNo: string,
  userId: number,
  userRole: string
): Promise<OrderResponse> => {
  const order = await OrderModel.findByOrderNo(orderNo);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only view their own orders
  if (userRole !== 'ADMIN' && order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  return OrderModel.toOrderResponse(order);
};

/**
 * Get all orders with filters
 * Users can only see their own orders, admins can see all
 */
export const getOrders = async (
  filters: OrderListFilters,
  userId: number,
  userRole: string
): Promise<{
  orders: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // If user is not admin, force filter to their own orders
  if (userRole !== 'ADMIN') {
    filters.user_id = userId;
  }

  const orders = await OrderModel.findAllWithUser(filters);
  const total = await OrderModel.count(filters);

  const limit = filters.limit || 10;
  const page = filters.offset ? Math.floor(filters.offset / limit) + 1 : 1;
  const totalPages = Math.ceil(total / limit);

  const orderResponses: OrderResponse[] = orders.map((order) => ({
    ...OrderModel.toOrderResponse(order),
    user: {
      id: order.user_id,
      name: order.user_name,
      email: order.user_email,
      company: order.user_company,
    },
  }));

  return {
    orders: orderResponses,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Get user's orders
 */
export const getUserOrders = async (
  userId: number
): Promise<OrderResponse[]> => {
  const orders = await OrderModel.findByUserId(userId);

  return orders.map((order) => OrderModel.toOrderResponse(order));
};

/**
 * Update order
 * Users can only update their own orders in PENDING/IN_PROGRESS status
 * Admins can update any order
 */
export const updateOrder = async (
  orderId: number,
  updateData: OrderUpdateInput,
  userId: number,
  userRole: string
): Promise<OrderResponse> => {
  const existingOrder = await OrderModel.findById(orderId);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only update their own orders
  if (userRole !== 'ADMIN' && existingOrder.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to update this order');
  }

  // Users cannot update completed or cancelled orders
  if (
    userRole !== 'ADMIN' &&
    (existingOrder.status === 'COMPLETED' || existingOrder.status === 'CANCELLED')
  ) {
    throw new ForbiddenError('Cannot update completed or cancelled orders');
  }

  // Users cannot change status (only admins can)
  if (userRole !== 'ADMIN' && updateData.status) {
    throw new ForbiddenError('You do not have permission to change order status');
  }

  // Validate order type specific fields
  if (updateData.order_type || Object.keys(updateData).length > 1) {
    validateOrderTypeFields({
      order_type: existingOrder.order_type,
      ...updateData,
    } as any);
  }

  const updatedOrder = await OrderModel.update(orderId, updateData);

  return OrderModel.toOrderResponse(updatedOrder);
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (
  orderId: number,
  status: string,
  userRole: string
): Promise<OrderResponse> => {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('Only admins can change order status');
  }

  const existingOrder = await OrderModel.findById(orderId);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Validate status transition
  validateStatusTransition(existingOrder.status, status);

  const updatedOrder = await OrderModel.updateStatus(orderId, status);

  return OrderModel.toOrderResponse(updatedOrder);
};

/**
 * Cancel order
 * Users can cancel their own orders, admins can cancel any order
 */
export const cancelOrder = async (
  orderId: number,
  userId: number,
  userRole: string
): Promise<OrderResponse> => {
  const existingOrder = await OrderModel.findById(orderId);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Authorization
  if (userRole !== 'ADMIN' && existingOrder.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to cancel this order');
  }

  // Cannot cancel already completed orders
  if (existingOrder.status === 'COMPLETED') {
    throw new ValidationError('Cannot cancel completed orders');
  }

  // Cannot cancel already cancelled orders
  if (existingOrder.status === 'CANCELLED') {
    throw new ValidationError('Order is already cancelled');
  }

  const updatedOrder = await OrderModel.updateStatus(orderId, 'CANCELLED');

  return OrderModel.toOrderResponse(updatedOrder);
};

/**
 * Delete order (Admin only)
 */
export const deleteOrder = async (
  orderId: number,
  userRole: string
): Promise<void> => {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('Only admins can delete orders');
  }

  const existingOrder = await OrderModel.findById(orderId);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  await OrderModel.hardDelete(orderId);
};

/**
 * Validate order type specific fields
 */
const validateOrderTypeFields = (orderData: OrderCreateInput | any): void => {
  const { order_type, number_of_colors, fabric, color_type } = orderData;

  // DIGITIZING and PATCHES require number_of_colors and fabric
  if (order_type === 'DIGITIZING' || order_type === 'PATCHES') {
    if (!number_of_colors) {
      throw new ValidationError(
        `Number of colors is required for ${order_type} orders`
      );
    }
    if (!fabric) {
      throw new ValidationError(`Fabric is required for ${order_type} orders`);
    }
  }

  // VECTOR requires color_type
  if (order_type === 'VECTOR') {
    if (!color_type) {
      throw new ValidationError('Color type is required for VECTOR orders');
    }
  }
};

/**
 * Validate status transition
 */
const validateStatusTransition = (
  currentStatus: string,
  newStatus: string
): void => {
  // Cannot change from COMPLETED or CANCELLED
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    throw new ValidationError(
      `Cannot change status from ${currentStatus} to ${newStatus}`
    );
  }

  // Valid transitions:
  // PENDING -> IN_PROGRESS, CANCELLED
  // IN_PROGRESS -> COMPLETED, CANCELLED

  const validTransitions: Record<string, string[]> = {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  };

  const allowedStatuses = validTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(newStatus)) {
    throw new ValidationError(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }
};
