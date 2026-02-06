import { query, queryOne } from '../config/database';
import { DatabaseError } from '../utils/errors';
import { Payment, PaymentCreateInput, PaymentStatus } from '../types/payment.types';

/**
 * Payment Model - Database operations for payments
 */

export const create = async (payment: PaymentCreateInput): Promise<Payment> => {
  try {
    const result: any = await query(
      `INSERT INTO payments (
        invoice_id, user_id, provider, provider_order_id, provider_capture_id,
        status, amount, currency, raw_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.invoice_id,
        payment.user_id,
        payment.provider,
        payment.provider_order_id,
        null,
        payment.status,
        payment.amount,
        payment.currency,
        payment.raw_response || null,
      ]
    );

    const paymentId = result.insertId;
    const created = await findById(paymentId);
    if (!created) {
      throw new DatabaseError('Failed to retrieve created payment');
    }

    return created;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('Payment already exists for this order');
    }
    throw new DatabaseError('Failed to create payment record');
  }
};

export const findById = async (paymentId: number): Promise<Payment | null> => {
  try {
    const payment = await queryOne<Payment>(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );
    return payment;
  } catch (error) {
    throw new DatabaseError('Failed to fetch payment');
  }
};

export const findByProviderOrderId = async (
  providerOrderId: string
): Promise<Payment | null> => {
  try {
    const payment = await queryOne<Payment>(
      'SELECT * FROM payments WHERE provider_order_id = ?',
      [providerOrderId]
    );
    return payment;
  } catch (error) {
    throw new DatabaseError('Failed to fetch payment by order ID');
  }
};

export const updateByProviderOrderId = async (
  providerOrderId: string,
  status: PaymentStatus,
  captureId?: string | null,
  rawResponse?: string | null
): Promise<void> => {
  try {
    await query(
      `UPDATE payments
       SET status = ?, provider_capture_id = ?, raw_response = ?, updated_at = NOW()
       WHERE provider_order_id = ?`,
      [status, captureId || null, rawResponse || null, providerOrderId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to update payment');
  }
};
