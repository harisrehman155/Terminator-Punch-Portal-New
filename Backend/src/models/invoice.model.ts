import { query, queryOne, getConnection } from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { generateInvoiceNumber } from '../utils/helpers';
import { getLookupId } from '../utils/lookup.helper';
import {
  Invoice,
  InvoiceWithDetails,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceListFilters,
  InvoiceItem,
  AvailableOrder,
} from '../types/invoice.types';
import { PoolConnection } from 'mysql2/promise';

/**
 * Invoice Model - Database operations for invoices
 */

/**
 * Create a new invoice with items (uses transaction)
 */
export const create = async (
  invoiceData: InvoiceCreateInput,
  adminUserId: number
): Promise<Invoice> => {
  let connection: PoolConnection | null = null;

  try {
    // Validation
    if (!invoiceData.order_ids || invoiceData.order_ids.length === 0) {
      throw new DatabaseError('At least one order is required for invoice');
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new DatabaseError('At least one line item is required for invoice');
    }

    // Get UNPAID status lookup ID
    const statusId = await getLookupId('invoice_status', 'UNPAID');
    if (!statusId) {
      throw new DatabaseError('UNPAID status not found in lookup table');
    }

    // Generate unique invoice number
    const invoiceNo = generateInvoiceNumber();

    // Calculate totals
    const subtotal = invoiceData.items.reduce(
      (sum, item) => sum + item.unit_price * (item.quantity || 1),
      0
    );
    const taxRate = invoiceData.tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Start transaction
    connection = await getConnection();
    await connection.beginTransaction();

    // Insert invoice
    const [invoiceResult]: any = await connection.execute(
      `INSERT INTO invoices (
        invoice_no, user_id, billing_period, billing_month, billing_year,
        status_id, subtotal, tax_rate, tax_amount, total_amount, currency,
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNo,
        invoiceData.user_id,
        invoiceData.billing_period,
        invoiceData.billing_month,
        invoiceData.billing_year,
        statusId,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        invoiceData.currency || 'USD',
        invoiceData.notes || null,
        adminUserId,
      ]
    );

    const invoiceId = invoiceResult.insertId;

    // Insert invoice items
    for (const item of invoiceData.items) {
      // Get service type ID from order
      const [orderResult]: any = await connection.execute(
        'SELECT service_type_id FROM orders WHERE id = ?',
        [item.order_id]
      );

      if (!orderResult || orderResult.length === 0) {
        throw new DatabaseError(`Order ${item.order_id} not found`);
      }

      const serviceTypeId = orderResult[0].service_type_id;
      const lineTotal = item.unit_price * (item.quantity || 1);

      await connection.execute(
        `INSERT INTO invoice_items (
          invoice_id, order_id, description, service_type_id,
          quantity, unit_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.order_id,
          item.description,
          serviceTypeId,
          item.quantity || 1,
          item.unit_price,
          lineTotal,
        ]
      );
    }

    // Insert invoice_orders junction records
    for (const orderId of invoiceData.order_ids) {
      await connection.execute(
        'INSERT INTO invoice_orders (invoice_id, order_id) VALUES (?, ?)',
        [invoiceId, orderId]
      );

      // Mark order as invoiced
      await connection.execute(
        'UPDATE orders SET is_invoiced = 1, invoiced_at = NOW() WHERE id = ?',
        [orderId]
      );
    }

    // Commit transaction
    await connection.commit();

    // Fetch and return the created invoice
    const invoice = await findById(invoiceId);
    if (!invoice) {
      throw new DatabaseError('Failed to retrieve created invoice');
    }

    return invoice;
  } catch (error: any) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('Invoice number already exists');
    }

    console.error('Error creating invoice:', error);
    throw new DatabaseError('Failed to create invoice');
  } finally {
    // Release connection
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Find invoice by ID with all details
 */
export const findById = async (invoiceId: number): Promise<InvoiceWithDetails | null> => {
  try {
    // Get invoice with user info
    const invoice = await queryOne<any>(
      `SELECT
        i.*,
        s.lookup_value as status,
        u.name as user_name,
        u.email as user_email,
        u.company as user_company
      FROM invoices i
      LEFT JOIN lookups s ON i.status_id = s.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ?`,
      [invoiceId]
    );

    if (!invoice) {
      return null;
    }

    // Get invoice items with order details
    const items = await query<any[]>(
      `SELECT
        ii.*,
        st.lookup_value as service_type,
        o.order_no,
        o.design_name
      FROM invoice_items ii
      LEFT JOIN lookups st ON ii.service_type_id = st.id
      LEFT JOIN orders o ON ii.order_id = o.id
      WHERE ii.invoice_id = ?
      ORDER BY ii.id`,
      [invoiceId]
    );

    // Get associated orders
    const orders = await query<any[]>(
      `SELECT
        o.id as order_id,
        o.order_no,
        o.design_name,
        st.lookup_value as service_type,
        os.lookup_value as status
      FROM invoice_orders io
      JOIN orders o ON io.order_id = o.id
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups os ON o.status_id = os.id
      WHERE io.invoice_id = ?
      ORDER BY o.created_at DESC`,
      [invoiceId]
    );

    return {
      ...invoice,
      items,
      orders,
    };
  } catch (error) {
    console.error('Error finding invoice by ID:', error);
    throw new DatabaseError('Failed to find invoice');
  }
};

/**
 * Find invoice by invoice number
 */
export const findByInvoiceNo = async (
  invoiceNo: string
): Promise<InvoiceWithDetails | null> => {
  try {
    const invoice = await queryOne<any>(
      'SELECT id FROM invoices WHERE invoice_no = ?',
      [invoiceNo]
    );

    if (!invoice) {
      return null;
    }

    return await findById(invoice.id);
  } catch (error) {
    console.error('Error finding invoice by invoice number:', error);
    throw new DatabaseError('Failed to find invoice by invoice number');
  }
};

/**
 * Find invoices by user ID with optional filters
 */
export const findByUserId = async (
  userId: number,
  filters: InvoiceListFilters = {}
): Promise<Invoice[]> => {
  try {
    let sql = `SELECT
      i.*,
      s.lookup_value as status
    FROM invoices i
    LEFT JOIN lookups s ON i.status_id = s.id
    WHERE i.user_id = ?`;
    const params: any[] = [userId];

    // Apply filters
    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.billing_month) {
      sql += ' AND i.billing_month = ?';
      params.push(filters.billing_month);
    }

    if (filters.billing_year) {
      sql += ' AND i.billing_year = ?';
      params.push(filters.billing_year);
    }

    if (filters.from_date) {
      sql += ' AND i.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND i.created_at <= ?';
      params.push(filters.to_date);
    }

    if (filters.search) {
      sql += ' AND (i.invoice_no LIKE ? OR i.billing_period LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY i.created_at DESC';

    // Pagination
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);

      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const invoices = await query<Invoice[]>(sql, params);
    return invoices;
  } catch (error) {
    console.error('Error finding invoices by user ID:', error);
    throw new DatabaseError('Failed to find invoices by user ID');
  }
};

/**
 * Find all invoices with optional filters (admin)
 */
export const findAll = async (
  filters: InvoiceListFilters = {}
): Promise<any[]> => {
  try {
    let sql = `SELECT
      i.*,
      s.lookup_value as status,
      u.name as user_name,
      u.email as user_email,
      u.company as user_company
    FROM invoices i
    LEFT JOIN lookups s ON i.status_id = s.id
    LEFT JOIN users u ON i.user_id = u.id
    WHERE 1=1`;
    const params: any[] = [];

    // Apply filters
    if (filters.user_id) {
      sql += ' AND i.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.billing_month) {
      sql += ' AND i.billing_month = ?';
      params.push(filters.billing_month);
    }

    if (filters.billing_year) {
      sql += ' AND i.billing_year = ?';
      params.push(filters.billing_year);
    }

    if (filters.from_date) {
      sql += ' AND i.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND i.created_at <= ?';
      params.push(filters.to_date);
    }

    if (filters.search) {
      sql += ' AND (i.invoice_no LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY i.created_at DESC';

    // Pagination
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);

      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const invoices = await query<any[]>(sql, params);
    return invoices;
  } catch (error) {
    console.error('Error finding all invoices:', error);
    throw new DatabaseError('Failed to find invoices');
  }
};

/**
 * Update invoice (only if not locked)
 */
export const update = async (
  invoiceId: number,
  updateData: InvoiceUpdateInput
): Promise<Invoice> => {
  let connection: PoolConnection | null = null;

  try {
    // Check if invoice exists and is not locked
    const invoice = await findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.is_locked === 1) {
      throw new DatabaseError('Cannot edit paid invoice - it is locked');
    }

    // Start transaction
    connection = await getConnection();
    await connection.beginTransaction();

    const updates: string[] = [];
    const params: any[] = [];

    if (updateData.billing_period !== undefined) {
      updates.push('billing_period = ?');
      params.push(updateData.billing_period);
    }

    if (updateData.billing_month !== undefined) {
      updates.push('billing_month = ?');
      params.push(updateData.billing_month);
    }

    if (updateData.billing_year !== undefined) {
      updates.push('billing_year = ?');
      params.push(updateData.billing_year);
    }

    if (updateData.tax_rate !== undefined) {
      updates.push('tax_rate = ?');
      params.push(updateData.tax_rate);
    }

    if (updateData.currency !== undefined) {
      updates.push('currency = ?');
      params.push(updateData.currency);
    }

    if (updateData.notes !== undefined) {
      updates.push('notes = ?');
      params.push(updateData.notes);
    }

    // Update items if provided
    if (updateData.items && updateData.items.length > 0) {
      // Recalculate totals
      const subtotal = updateData.items.reduce(
        (sum, item) => sum + item.unit_price * (item.quantity || 1),
        0
      );
      const taxRate = updateData.tax_rate !== undefined ? updateData.tax_rate : invoice.tax_rate;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      updates.push('subtotal = ?', 'tax_amount = ?', 'total_amount = ?');
      params.push(subtotal, taxAmount, totalAmount);

      // Delete existing items
      await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

      // Insert updated items
      for (const item of updateData.items) {
        // Get service type ID from order
        const [orderResult]: any = await connection.execute(
          'SELECT service_type_id FROM orders WHERE id = ?',
          [item.order_id]
        );

        if (!orderResult || orderResult.length === 0) {
          throw new DatabaseError(`Order ${item.order_id} not found`);
        }

        const serviceTypeId = orderResult[0].service_type_id;
        const lineTotal = item.unit_price * (item.quantity || 1);

        await connection.execute(
          `INSERT INTO invoice_items (
            invoice_id, order_id, description, service_type_id,
            quantity, unit_price, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            item.order_id,
            item.description,
            serviceTypeId,
            item.quantity || 1,
            item.unit_price,
            lineTotal,
          ]
        );
      }
    }

    // Update invoice if there are changes
    if (updates.length > 0) {
      params.push(invoiceId);
      const sql = `UPDATE invoices SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
      await connection.execute(sql, params);
    }

    await connection.commit();

    const updatedInvoice = await findById(invoiceId);
    if (!updatedInvoice) {
      throw new NotFoundError('Invoice not found after update');
    }

    return updatedInvoice;
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }

    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }

    console.error('Error updating invoice:', error);
    throw new DatabaseError('Failed to update invoice');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Mark invoice as PAID and lock it
 */
export const markAsPaid = async (invoiceId: number): Promise<Invoice> => {
  try {
    const statusId = await getLookupId('invoice_status', 'PAID');
    if (!statusId) {
      throw new DatabaseError('PAID status not found in lookup table');
    }

    await query(
      `UPDATE invoices
       SET status_id = ?, is_locked = 1, paid_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [statusId, invoiceId]
    );

    const invoice = await findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice not found after marking as paid');
    }

    return invoice;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }

    console.error('Error marking invoice as paid:', error);
    throw new DatabaseError('Failed to mark invoice as paid');
  }
};

/**
 * Update PDF file path for invoice
 */
export const updatePDFPath = async (
  invoiceId: number,
  pdfPath: string
): Promise<void> => {
  try {
    await query(
      'UPDATE invoices SET pdf_file_path = ?, updated_at = NOW() WHERE id = ?',
      [pdfPath, invoiceId]
    );
  } catch (error) {
    console.error('Error updating PDF path:', error);
    throw new DatabaseError('Failed to update PDF path');
  }
};

/**
 * Get orders available for invoicing (not yet invoiced)
 */
export const getAvailableOrders = async (userId: number): Promise<AvailableOrder[]> => {
  try {
    const orders = await query<any[]>(
      `SELECT
        o.id,
        o.order_no,
        o.design_name,
        st.lookup_value as service_type,
        s.lookup_value as status,
        o.price,
        o.currency,
        o.pricing_notes,
        o.created_at
      FROM orders o
      LEFT JOIN lookups st ON o.service_type_id = st.id
      LEFT JOIN lookups s ON o.status_id = s.id
      WHERE o.user_id = ?
        AND o.is_invoiced = 0
        AND s.lookup_value IN ('IN_PROGRESS', 'COMPLETED')
      ORDER BY o.created_at DESC`,
      [userId]
    );

    return orders;
  } catch (error) {
    console.error('Error getting available orders:', error);
    throw new DatabaseError('Failed to get available orders');
  }
};

/**
 * Delete invoice (only if not locked/paid)
 */
export const deleteInvoice = async (invoiceId: number): Promise<void> => {
  let connection: PoolConnection | null = null;

  try {
    // Check if invoice exists and is not locked
    const invoice = await findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.is_locked === 1) {
      throw new DatabaseError('Cannot delete paid invoice - it is locked');
    }

    // Start transaction
    connection = await getConnection();
    await connection.beginTransaction();

    // Get all order IDs from this invoice
    const orderIds = invoice.orders.map(o => o.order_id);

    // Unmark orders as invoiced
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      await connection.execute(
        `UPDATE orders SET is_invoiced = 0, invoiced_at = NULL WHERE id IN (${placeholders})`,
        orderIds
      );
    }

    // Delete invoice (cascade will delete invoice_items and invoice_orders)
    await connection.execute('DELETE FROM invoices WHERE id = ?', [invoiceId]);

    await connection.commit();
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }

    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }

    console.error('Error deleting invoice:', error);
    throw new DatabaseError('Failed to delete invoice');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Get invoice count by filters
 */
export const count = async (filters: InvoiceListFilters = {}): Promise<number> => {
  try {
    let sql = `SELECT COUNT(*) as count
      FROM invoices i
      LEFT JOIN lookups s ON i.status_id = s.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1`;
    const params: any[] = [];

    if (filters.user_id) {
      sql += ' AND i.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.billing_month) {
      sql += ' AND i.billing_month = ?';
      params.push(filters.billing_month);
    }

    if (filters.billing_year) {
      sql += ' AND i.billing_year = ?';
      params.push(filters.billing_year);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  } catch (error) {
    console.error('Error counting invoices:', error);
    throw new DatabaseError('Failed to count invoices');
  }
};
