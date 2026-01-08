import { query, queryOne } from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { generateOrderNumber } from '../utils/helpers';
import { getLookupId } from '../utils/lookup.helper';
import {
  Order,
  OrderCreateInput,
  OrderUpdateInput,
  OrderListFilters,
  OrderWithUser,
  OrderResponse,
} from '../types/order.types';

/**
 * Order Model - Database operations for orders
 */

/**
 * Create a new order
 */
export const create = async (
  userId: number,
  orderData: OrderCreateInput
): Promise<Order> => {
  try {
    // Generate unique order number
    const orderNo = generateOrderNumber();

    // Get lookup IDs for order type, status, and unit
    const serviceTypeId = await getLookupId('order_type', orderData.order_type);
    if (!serviceTypeId) {
      throw new DatabaseError('Invalid order type');
    }

    const statusId = await getLookupId('order_status', 'IN_PROGRESS');
    if (!statusId) {
      throw new DatabaseError('IN_PROGRESS status not found in lookup table');
    }

    let unitId: number | null = null;
    if (orderData.unit) {
      unitId = await getLookupId('unit', orderData.unit);
    }

    // Prepare JSON fields
    const placement = orderData.placement
      ? JSON.stringify(orderData.placement)
      : null;
    const requiredFormat = orderData.required_format
      ? JSON.stringify(orderData.required_format)
      : null;

    const result: any = await query(
      `INSERT INTO orders (
        user_id, order_no, service_type_id, status_id, design_name,
        height, width, unit_id, number_of_colors, fabric, color_type,
        placement, required_format, instruction, is_urgent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        orderNo,
        serviceTypeId,
        statusId,
        orderData.design_name,
        orderData.height || null,
        orderData.width || null,
        unitId,
        orderData.number_of_colors || null,
        orderData.fabric || null,
        orderData.color_type || null,
        placement,
        requiredFormat,
        orderData.instruction || null,
        orderData.is_urgent || 0,
      ]
    );

    const orderId = result.insertId;
    const order = await findById(orderId);

    if (!order) {
      throw new DatabaseError('Failed to retrieve created order');
    }

    return order;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('Order number already exists');
    }
    throw new DatabaseError('Failed to create order');
  }
};

/**
 * Find order by ID
 */
export const findById = async (orderId: number): Promise<Order | null> => {
  try {
    const order = await queryOne<any>(
      `SELECT
        o.*,
        st.lookup_value as order_type,
        s.lookup_value as status,
        u.lookup_value as unit
      FROM orders o
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups s ON o.status_id = s.id
      LEFT JOIN lookups u ON o.unit_id = u.id
      WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      return null;
    }

    return parseOrderFromDB(order);
  } catch (error) {
    throw new DatabaseError('Failed to find order');
  }
};

/**
 * Find order by order number
 */
export const findByOrderNo = async (
  orderNo: string
): Promise<Order | null> => {
  try {
    const order = await queryOne<any>(
      `SELECT
        o.*,
        st.lookup_value as order_type,
        s.lookup_value as status,
        u.lookup_value as unit
      FROM orders o
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups s ON o.status_id = s.id
      LEFT JOIN lookups u ON o.unit_id = u.id
      WHERE o.order_no = ?`,
      [orderNo]
    );

    if (!order) {
      return null;
    }

    return parseOrderFromDB(order);
  } catch (error) {
    throw new DatabaseError('Failed to find order by order number');
  }
};

/**
 * Find orders by user ID
 */
export const findByUserId = async (userId: number): Promise<Order[]> => {
  try {
    const orders = await query<any[]>(
      `SELECT
        o.*,
        st.lookup_value as order_type,
        s.lookup_value as status,
        u.lookup_value as unit
      FROM orders o
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups s ON o.status_id = s.id
      LEFT JOIN lookups u ON o.unit_id = u.id
      WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [userId]
    );

    return orders.map(parseOrderFromDB);
  } catch (error) {
    throw new DatabaseError('Failed to find orders by user ID');
  }
};

/**
 * Find order with user info
 */
export const findByIdWithUser = async (
  orderId: number
): Promise<OrderWithUser | null> => {
  try {
    const order = await queryOne<any>(
      `SELECT
        o.*,
        st.lookup_value as order_type,
        s.lookup_value as status,
        u2.lookup_value as unit,
        u.name as user_name,
        u.email as user_email,
        u.company as user_company
      FROM orders o
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups s ON o.status_id = s.id
      LEFT JOIN lookups u2 ON o.unit_id = u2.id
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      return null;
    }

    return parseOrderWithUserFromDB(order);
  } catch (error) {
    throw new DatabaseError('Failed to find order with user');
  }
};

/**
 * Get all orders with optional filters
 */
export const findAll = async (
  filters: OrderListFilters = {}
): Promise<Order[]> => {
  try {
    let sql = `SELECT
      o.*,
      st.lookup_value as order_type,
      s.lookup_value as status,
      u.lookup_value as unit
    FROM orders o
    LEFT JOIN lookups st ON o.service_type_id = st.id
    LEFT JOIN lookups s ON o.status_id = s.id
    LEFT JOIN lookups u ON o.unit_id = u.id
    WHERE 1=1`;
    const params: any[] = [];

    // Apply filters
    if (filters.user_id) {
      sql += ' AND o.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.order_type) {
      sql += ' AND st.lookup_value = ?';
      params.push(filters.order_type);
    }

    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.is_urgent !== undefined) {
      sql += ' AND o.is_urgent = ?';
      params.push(filters.is_urgent);
    }

    if (filters.search) {
      sql += ' AND (o.order_no LIKE ? OR o.design_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.from_date) {
      sql += ' AND o.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND o.created_at <= ?';
      params.push(filters.to_date);
    }

    // Order by created_at DESC
    sql += ' ORDER BY o.created_at DESC';

    // Pagination
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);

      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const orders = await query<any[]>(sql, params);

    return orders.map(parseOrderFromDB);
  } catch (error) {
    throw new DatabaseError('Failed to fetch orders');
  }
};

/**
 * Get all orders with user info and optional filters
 */
export const findAllWithUser = async (
  filters: OrderListFilters = {}
): Promise<OrderWithUser[]> => {
  try {
    let sql = `SELECT
               o.*,
               st.lookup_value as order_type,
               s.lookup_value as status,
               u2.lookup_value as unit,
               u.name as user_name,
               u.email as user_email,
               u.company as user_company
               FROM orders o
               LEFT JOIN lookups st ON o.service_type_id = st.id
               LEFT JOIN lookups s ON o.status_id = s.id
               LEFT JOIN lookups u2 ON o.unit_id = u2.id
               INNER JOIN users u ON o.user_id = u.id
               WHERE 1=1`;
    const params: any[] = [];

    // Apply filters
    if (filters.user_id) {
      sql += ' AND o.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.order_type) {
      sql += ' AND st.lookup_value = ?';
      params.push(filters.order_type);
    }

    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.is_urgent !== undefined) {
      sql += ' AND o.is_urgent = ?';
      params.push(filters.is_urgent);
    }

    if (filters.search) {
      sql += ' AND (o.order_no LIKE ? OR o.design_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.from_date) {
      sql += ' AND o.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND o.created_at <= ?';
      params.push(filters.to_date);
    }

    // Order by created_at DESC
    sql += ' ORDER BY o.created_at DESC';

    // Pagination
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);

      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const orders = await query<any[]>(sql, params);

    return orders.map(parseOrderWithUserFromDB);
  } catch (error) {
    throw new DatabaseError('Failed to fetch orders with user');
  }
};

/**
 * Update order
 */
export const update = async (
  orderId: number,
  updateData: OrderUpdateInput
): Promise<Order> => {
  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (updateData.design_name !== undefined) {
      updates.push('design_name = ?');
      params.push(updateData.design_name);
    }

    if (updateData.height !== undefined) {
      updates.push('height = ?');
      params.push(updateData.height);
    }

    if (updateData.width !== undefined) {
      updates.push('width = ?');
      params.push(updateData.width);
    }

    if (updateData.unit !== undefined) {
      const unitId = updateData.unit
        ? await getLookupId('unit', updateData.unit)
        : null;
      updates.push('unit_id = ?');
      params.push(unitId);
    }

    if (updateData.number_of_colors !== undefined) {
      updates.push('number_of_colors = ?');
      params.push(updateData.number_of_colors);
    }

    if (updateData.fabric !== undefined) {
      updates.push('fabric = ?');
      params.push(updateData.fabric);
    }

    if (updateData.color_type !== undefined) {
      updates.push('color_type = ?');
      params.push(updateData.color_type);
    }

    if (updateData.placement !== undefined) {
      updates.push('placement = ?');
      params.push(JSON.stringify(updateData.placement));
    }

    if (updateData.required_format !== undefined) {
      updates.push('required_format = ?');
      params.push(JSON.stringify(updateData.required_format));
    }

    if (updateData.instruction !== undefined) {
      updates.push('instruction = ?');
      params.push(updateData.instruction);
    }

    if (updateData.is_urgent !== undefined) {
      updates.push('is_urgent = ?');
      params.push(updateData.is_urgent);
    }

    if (updateData.status !== undefined) {
      const statusId = await getLookupId('order_status', updateData.status);
      if (!statusId) {
        throw new DatabaseError('Invalid order status');
      }
      updates.push('status_id = ?');
      params.push(statusId);
    }

    if (updates.length === 0) {
      const order = await findById(orderId);
      if (!order) {
        throw new NotFoundError('Order not found');
      }
      return order;
    }

    params.push(orderId);
    const sql = `UPDATE orders SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;

    await query(sql, params);

    const order = await findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found after update');
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update order');
  }
};

/**
 * Update order status
 */
export const updateStatus = async (
  orderId: number,
  status: string
): Promise<Order> => {
  try {
    const statusId = await getLookupId('order_status', status);
    if (!statusId) {
      throw new DatabaseError('Invalid order status');
    }

    await query(
      'UPDATE orders SET status_id = ?, updated_at = NOW() WHERE id = ?',
      [statusId, orderId]
    );

    const order = await findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found after status update');
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update order status');
  }
};

/**
 * Delete order (soft delete by setting status to CANCELLED)
 */
export const softDelete = async (orderId: number): Promise<void> => {
  try {
    const statusId = await getLookupId('order_status', 'CANCELLED');
    if (!statusId) {
      throw new DatabaseError('Invalid order status');
    }

    await query(
      'UPDATE orders SET status_id = ?, updated_at = NOW() WHERE id = ?',
      [statusId, orderId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to delete order');
  }
};

/**
 * Hard delete order
 */
export const hardDelete = async (orderId: number): Promise<void> => {
  try {
    await query('DELETE FROM orders WHERE id = ?', [orderId]);
  } catch (error) {
    throw new DatabaseError('Failed to permanently delete order');
  }
};

/**
 * Get order count by filters
 */
export const count = async (filters: OrderListFilters = {}): Promise<number> => {
  try {
    let sql = `SELECT COUNT(*) as count
      FROM orders o
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups s ON o.status_id = s.id
      WHERE 1=1`;
    const params: any[] = [];

    if (filters.user_id) {
      sql += ' AND o.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.order_type) {
      sql += ' AND st.lookup_value = ?';
      params.push(filters.order_type);
    }

    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.is_urgent !== undefined) {
      sql += ' AND o.is_urgent = ?';
      params.push(filters.is_urgent);
    }

    if (filters.search) {
      sql += ' AND (o.order_no LIKE ? OR o.design_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.from_date) {
      sql += ' AND o.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND o.created_at <= ?';
      params.push(filters.to_date);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  } catch (error) {
    throw new DatabaseError('Failed to count orders');
  }
};

/**
 * Convert order response (remove sensitive data)
 */
export const toOrderResponse = (order: Order): OrderResponse => {
  return {
    id: order.id,
    order_no: order.order_no,
    order_type: order.order_type ?? order.service_type,
    status: order.status,
    design_name: order.design_name,
    height: order.height,
    width: order.width,
    unit: order.unit,
    number_of_colors: order.number_of_colors,
    fabric: order.fabric,
    color_type: order.color_type,
    placement: order.placement,
    required_format: order.required_format,
    instruction: order.instruction,
    is_urgent: order.is_urgent,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
};

/**
 * Parse order from database result
 */
const parseOrderFromDB = (dbOrder: any): Order => {
  return {
    ...dbOrder,
    placement: dbOrder.placement ? JSON.parse(dbOrder.placement) : null,
    required_format: dbOrder.required_format
      ? JSON.parse(dbOrder.required_format)
      : null,
  };
};

/**
 * Parse order with user from database result
 */
const parseOrderWithUserFromDB = (dbOrder: any): OrderWithUser => {
  return {
    ...parseOrderFromDB(dbOrder),
    user_name: dbOrder.user_name,
    user_email: dbOrder.user_email,
    user_company: dbOrder.user_company,
  };
};
