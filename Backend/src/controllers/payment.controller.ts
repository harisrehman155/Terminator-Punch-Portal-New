import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import * as InvoiceModel from '../models/invoice.model';
import * as PaymentModel from '../models/payment.model';
import * as PayPalService from '../services/paypal.service';
import { sendInvoicePaidNotification } from '../services/email.service';
import * as UserModel from '../models/user.model';

const normalizeAmount = (value: any) =>
  Number.parseFloat(value || 0).toFixed(2);

/**
 * Create PayPal order for invoice
 * POST /api/payments/paypal/create-order
 */
export const createPayPalOrder = asyncHandler(async (req: Request, res: Response) => {
  const { invoiceId } = req.body;

  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!invoiceId || Number.isNaN(Number(invoiceId))) {
    throw new ValidationError('Valid invoice ID is required');
  }

  const invoice = await InvoiceModel.findById(Number(invoiceId));
  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  if (req.user.role !== 'ADMIN' && invoice.user_id !== req.user.userId) {
    throw new UnauthorizedError('Access denied');
  }

  if (invoice.status !== 'UNPAID' || invoice.is_locked === 1) {
    throw new ValidationError('Invoice is already paid or locked');
  }

  const amount = normalizeAmount(invoice.total_amount);
  const currency = invoice.currency || 'USD';

  const order = await PayPalService.createOrder({
    amount,
    currency,
    invoiceNo: invoice.invoice_no,
  });

  await PaymentModel.create({
    invoice_id: invoice.id,
    user_id: req.user.userId,
    provider: 'paypal',
    provider_order_id: order.id,
    amount: Number(amount),
    currency,
    status: order.status || 'CREATED',
    raw_response: JSON.stringify(order),
  });

  return successResponse(res, 'PayPal order created', {
    orderId: order.id,
  });
});

/**
 * Capture PayPal order and mark invoice as paid
 * POST /api/payments/paypal/capture-order
 */
export const capturePayPalOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, invoiceId } = req.body;

  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!orderId || !invoiceId || Number.isNaN(Number(invoiceId))) {
    throw new ValidationError('Order ID and invoice ID are required');
  }

  const invoice = await InvoiceModel.findById(Number(invoiceId));
  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  if (req.user.role !== 'ADMIN' && invoice.user_id !== req.user.userId) {
    throw new UnauthorizedError('Access denied');
  }

  const payment = await PaymentModel.findByProviderOrderId(orderId);
  if (!payment) {
    throw new ValidationError('Payment record not found for this order');
  }

  if (payment.invoice_id !== invoice.id) {
    throw new ValidationError('Order does not match invoice');
  }

  if (invoice.status === 'PAID') {
    return successResponse(res, 'Invoice already paid', { invoice });
  }

  const capture = await PayPalService.captureOrder(orderId);

  const captureInfo =
    capture?.purchase_units?.[0]?.payments?.captures?.[0] || null;

  if (!captureInfo) {
    await PaymentModel.updateByProviderOrderId(
      orderId,
      capture.status || 'FAILED',
      null,
      JSON.stringify(capture)
    );
    throw new ValidationError('Payment capture failed');
  }

  const capturedAmount = normalizeAmount(captureInfo.amount?.value);
  const capturedCurrency = captureInfo.amount?.currency_code;
  const expectedAmount = normalizeAmount(invoice.total_amount);
  const expectedCurrency = invoice.currency || 'USD';

  if (
    capturedAmount !== expectedAmount ||
    capturedCurrency !== expectedCurrency
  ) {
    await PaymentModel.updateByProviderOrderId(
      orderId,
      'MISMATCH',
      captureInfo.id,
      JSON.stringify(capture)
    );
    throw new ValidationError('Payment amount does not match invoice');
  }

  if (captureInfo.status !== 'COMPLETED') {
    await PaymentModel.updateByProviderOrderId(
      orderId,
      captureInfo.status || 'FAILED',
      captureInfo.id,
      JSON.stringify(capture)
    );
    throw new ValidationError('Payment is not completed');
  }

  await PaymentModel.updateByProviderOrderId(
    orderId,
    'COMPLETED',
    captureInfo.id,
    JSON.stringify(capture)
  );

  const paidInvoice = await InvoiceModel.markAsPaid(invoice.id);

  const user = await UserModel.findById(paidInvoice.user_id);
  if (user) {
    sendInvoicePaidNotification(paidInvoice, {
      name: user.name,
      email: user.email,
    }).catch((error) => {
      console.error(`✗ Failed to send payment confirmation email for ${paidInvoice.invoice_no}:`, error);
    });
  }

  return successResponse(res, 'Payment captured successfully', {
    invoice: paidInvoice,
  });
});
