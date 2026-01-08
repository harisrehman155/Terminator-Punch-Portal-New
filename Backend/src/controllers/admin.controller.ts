import { Request, Response } from 'express';
import * as UserModel from '../models/user.model';
import * as OrderModel from '../models/order.model';
import * as QuoteModel from '../models/quote.model';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError, ForbiddenError } from '../utils/errors';

/**
 * Admin Controller - Handle administrative operations
 */

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  const users = await UserModel.findAll();
  const usersResponse = users.map(UserModel.toUserResponse);

  return successResponse(res, 'Users retrieved successfully', usersResponse);
});

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ValidationError('User not found');
  }

  const userResponse = UserModel.toUserResponse(user);

  return successResponse(res, 'User retrieved successfully', userResponse);
});

/**
 * Toggle user active status
 * PATCH /api/admin/users/:id/toggle-status
 */
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    throw new ValidationError('Invalid user ID');
  }

  const updatedUser = await UserModel.toggleActiveStatus(userId);
  const userResponse = UserModel.toUserResponse(updatedUser);

  return successResponse(
    res,
    `User ${userResponse.is_active ? 'activated' : 'deactivated'} successfully`,
    userResponse
  );
});

/**
 * Get system statistics
 * GET /api/admin/stats
 */
export const getSystemStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  // Get user statistics
  const totalUsersResult: any = await UserModel.query(
    'SELECT COUNT(*) as count FROM users'
  );
  const activeUsersResult: any = await UserModel.query(
    'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
  );

  // Get order statistics
  const totalOrdersResult: any = await UserModel.query(
    'SELECT COUNT(*) as count FROM orders'
  );
  const pendingOrdersResult: any = await UserModel.query(
    'SELECT COUNT(*) as count FROM orders WHERE status = "IN_PROGRESS"'
  );
  const completedOrdersResult: any = await UserModel.query(
    'SELECT COUNT(*) as count FROM orders WHERE status = "COMPLETED"'
  );

  // Get quote statistics
  const totalQuotesResult: any = await UserModel.query(
    'SELECT COUNT(*) as count FROM quotes'
  );
  const pendingQuotesResult: any = await UserModel.query(
    `SELECT COUNT(*) as count FROM quotes q
     LEFT JOIN lookups l ON q.status_id = l.id
     WHERE l.lookup_value = 'PENDING'`
  );
  const pricedQuotesResult: any = await UserModel.query(
    `SELECT COUNT(*) as count FROM quotes q
     LEFT JOIN lookups l ON q.status_id = l.id
     WHERE l.lookup_value = 'PRICED'`
  );

  const stats = {
    users: {
      total: totalUsersResult[0].count,
      active: activeUsersResult[0].count,
    },
    orders: {
      total: totalOrdersResult[0].count,
      pending: pendingOrdersResult[0].count,
      completed: completedOrdersResult[0].count,
    },
    quotes: {
      total: totalQuotesResult[0].count,
      pending: pendingQuotesResult[0].count,
      priced: pricedQuotesResult[0].count,
    },
  };

  return successResponse(res, 'System statistics retrieved successfully', stats);
});

/**
 * Get all orders for admin
 * GET /api/admin/orders
 */
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  // Parse query parameters for filtering
  const filters: any = {
    order_type: req.query.order_type as string,
    status: req.query.status as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const orders = await OrderModel.findAllWithUser(filters);
  const total = await OrderModel.count(filters);

  const orderResponses = orders.map((order) => ({
    ...OrderModel.toOrderResponse(order),
    user: {
      id: order.user_id,
      name: order.user_name,
      email: order.user_email,
      company: order.user_company,
    },
  }));

  return successResponse(res, 'Orders retrieved successfully', {
    orders: orderResponses,
    total,
    page: Math.floor(filters.offset / filters.limit) + 1,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  });
});

/**
 * Get all quotes for admin
 * GET /api/admin/quotes
 */
export const getAllQuotes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  // Parse query parameters for filtering
  const filters: any = {
    service_type: req.query.service_type as string,
    status: req.query.status as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const quotes = await QuoteModel.findAll(filters);
  const total = quotes.length; // Simplified count

  const quoteResponses = [];

  for (const quote of quotes) {
    const quoteWithUser = await QuoteModel.findByIdWithUser(quote.id!);
    if (quoteWithUser) {
      quoteResponses.push({
        ...QuoteModel.toQuoteResponse(quote),
        user: {
          id: quoteWithUser.user_id,
          name: quoteWithUser.user_name,
          email: quoteWithUser.user_email,
          company: quoteWithUser.user_company,
        },
      });
    }
  }

  return successResponse(res, 'Quotes retrieved successfully', {
    quotes: quoteResponses,
    total,
    page: Math.floor(filters.offset / filters.limit) + 1,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  });
});
