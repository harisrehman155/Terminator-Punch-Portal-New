import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import * as InvoiceModel from '../models/invoice.model';
import * as UserModel from '../models/user.model';
import * as PDFService from '../services/pdf.service';
import {
  sendInvoiceCreatedNotification,
  sendInvoicePaidNotification,
} from '../services/email.service';
import { successResponse, createdResponse } from '../utils/response';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors';

/**
 * Invoice Controller - HTTP request handlers
 */

/**
 * Create new invoice
 * POST /api/admin/invoices
 */
export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = req.user!.userId;
  const invoiceData = req.body;

  // Validation
  if (!invoiceData.user_id) {
    throw new ValidationError('Customer ID is required');
  }

  if (!invoiceData.order_ids || invoiceData.order_ids.length === 0) {
    throw new ValidationError('At least one order is required');
  }

  if (!invoiceData.items || invoiceData.items.length === 0) {
    throw new ValidationError('At least one line item is required');
  }

  if (!invoiceData.billing_period) {
    throw new ValidationError('Billing period is required');
  }

  if (!invoiceData.billing_month || !invoiceData.billing_year) {
    throw new ValidationError('Billing month and year are required');
  }

  // Create invoice
  const invoice = await InvoiceModel.create(invoiceData, adminUserId);

  // Generate PDF and send email notification in background (non-blocking)
  PDFService.generateInvoicePDF(invoice.id)
    .then(async (pdfPath) => {
      await InvoiceModel.updatePDFPath(invoice.id, pdfPath);
      console.log(`✓ PDF generated and path updated for invoice ${invoice.invoice_no}`);

      // Send email with PDF attachment
      try {
        const pdfBuffer = await PDFService.generateInvoicePDFBuffer(invoice.id);
        const user = await UserModel.findById(invoice.user_id);

        if (user) {
          await sendInvoiceCreatedNotification(invoice, {
            name: user.name,
            email: user.email,
          }, pdfBuffer);
          console.log(`✓ Invoice email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.error(`✗ Failed to send invoice email for ${invoice.invoice_no}:`, emailError);
      }
    })
    .catch((error) => {
      console.error(`✗ Failed to generate PDF for invoice ${invoice.invoice_no}:`, error);
    });

  return createdResponse(res, 'Invoice created successfully', invoice);
});

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id);
  const invoice = await InvoiceModel.findById(invoiceId);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // Authorization: user can only see their own invoices (unless admin)
  if (req.user!.role !== 'ADMIN' && invoice.user_id !== req.user!.userId) {
    throw new UnauthorizedError('Access denied');
  }

  return successResponse(res, 'Invoice retrieved successfully', invoice);
});

/**
 * Get user's invoices
 * GET /api/invoices/user/:userId
 */
export const getUserInvoices = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);

  // Authorization: user can only see their own invoices (unless admin)
  if (req.user!.role !== 'ADMIN' && req.user!.userId !== userId) {
    throw new UnauthorizedError('Access denied');
  }

  const filters = {
    status: req.query.status as string,
    billing_month: req.query.month ? parseInt(req.query.month as string) : undefined,
    billing_year: req.query.year ? parseInt(req.query.year as string) : undefined,
    from_date: req.query.from_date as string,
    to_date: req.query.to_date as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  };

  const invoices = await InvoiceModel.findByUserId(userId, filters);

  return successResponse(res, 'Invoices retrieved successfully', invoices);
});

/**
 * Get all invoices (admin only)
 * GET /api/admin/invoices
 */
export const getAllInvoices = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
    status: req.query.status as string,
    billing_month: req.query.month ? parseInt(req.query.month as string) : undefined,
    billing_year: req.query.year ? parseInt(req.query.year as string) : undefined,
    from_date: req.query.from_date as string,
    to_date: req.query.to_date as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  };

  const invoices = await InvoiceModel.findAll(filters);

  return successResponse(res, 'Invoices retrieved successfully', invoices);
});

/**
 * Update invoice
 * PUT /api/admin/invoices/:id
 */
export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id);
  const updateData = req.body;

  const invoice = await InvoiceModel.update(invoiceId, updateData);

  return successResponse(res, 'Invoice updated successfully', invoice);
});

/**
 * Mark invoice as paid
 * PATCH /api/admin/invoices/:id/mark-paid
 */
export const markInvoiceAsPaid = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id);

  const invoice = await InvoiceModel.markAsPaid(invoiceId);

  // Send payment confirmation email (non-blocking)
  const user = await UserModel.findById(invoice.user_id);
  if (user) {
    sendInvoicePaidNotification(invoice, {
      name: user.name,
      email: user.email,
    }).catch((error) => {
      console.error(`✗ Failed to send payment confirmation email for ${invoice.invoice_no}:`, error);
    });
  }

  return successResponse(res, 'Invoice marked as paid', invoice);
});

/**
 * Download invoice PDF
 * GET /api/invoices/:id/download
 */
export const downloadInvoicePDF = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id);
  const invoice = await InvoiceModel.findById(invoiceId);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // Authorization: user can only download their own invoices (unless admin)
  if (req.user!.role !== 'ADMIN' && invoice.user_id !== req.user!.userId) {
    throw new UnauthorizedError('Access denied');
  }

  if (!invoice.pdf_file_path) {
    throw new NotFoundError('PDF not found for this invoice');
  }

  // Send file
  res.download(invoice.pdf_file_path, `${invoice.invoice_no}.pdf`, (err) => {
    if (err) {
      console.error('Error downloading PDF:', err);
      throw new NotFoundError('Failed to download PDF');
    }
  });
});

/**
 * Get available orders for invoicing
 * GET /api/admin/invoices/available-orders/:userId
 */
export const getAvailableOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const orders = await InvoiceModel.getAvailableOrders(userId);

  return successResponse(res, 'Available orders retrieved successfully', orders);
});

/**
 * Delete invoice
 * DELETE /api/admin/invoices/:id
 */
export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id);

  await InvoiceModel.deleteInvoice(invoiceId);

  return successResponse(res, 'Invoice deleted successfully', null);
});

/**
 * Get invoice count
 * GET /api/admin/invoices/count
 */
export const getInvoiceCount = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
    status: req.query.status as string,
    billing_month: req.query.month ? parseInt(req.query.month as string) : undefined,
    billing_year: req.query.year ? parseInt(req.query.year as string) : undefined,
  };

  const count = await InvoiceModel.count(filters);

  return successResponse(res, 'Invoice count retrieved successfully', { count });
});
