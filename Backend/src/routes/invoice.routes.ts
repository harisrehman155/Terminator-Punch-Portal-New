import { Router } from 'express';
import * as InvoiceController from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

/**
 * Invoice Routes
 */

// ============================================================================
// ADMIN ROUTES (require admin role)
// ============================================================================

/**
 * @route   POST /api/admin/invoices
 * @desc    Create new invoice
 * @access  Admin only
 */
router.post(
  '/admin/invoices',
  authenticate,
  requireAdmin,
  InvoiceController.createInvoice
);

/**
 * @route   GET /api/admin/invoices
 * @desc    Get all invoices with filters
 * @access  Admin only
 */
router.get(
  '/admin/invoices',
  authenticate,
  requireAdmin,
  InvoiceController.getAllInvoices
);

/**
 * @route   GET /api/admin/invoices/count
 * @desc    Get invoice count
 * @access  Admin only
 */
router.get(
  '/admin/invoices/count',
  authenticate,
  requireAdmin,
  InvoiceController.getInvoiceCount
);

/**
 * @route   GET /api/admin/invoices/available-orders/:userId
 * @desc    Get orders available for invoicing for a specific user
 * @access  Admin only
 */
router.get(
  '/admin/invoices/available-orders/:userId',
  authenticate,
  requireAdmin,
  InvoiceController.getAvailableOrders
);

/**
 * @route   PUT /api/admin/invoices/:id
 * @desc    Update invoice (only if not locked/paid)
 * @access  Admin only
 */
router.put(
  '/admin/invoices/:id',
  authenticate,
  requireAdmin,
  InvoiceController.updateInvoice
);

/**
 * @route   PATCH /api/admin/invoices/:id/mark-paid
 * @desc    Mark invoice as paid and lock it
 * @access  Admin only
 */
router.patch(
  '/admin/invoices/:id/mark-paid',
  authenticate,
  requireAdmin,
  InvoiceController.markInvoiceAsPaid
);

/**
 * @route   DELETE /api/admin/invoices/:id
 * @desc    Delete invoice (only if not locked/paid)
 * @access  Admin only
 */
router.delete(
  '/admin/invoices/:id',
  authenticate,
  requireAdmin,
  InvoiceController.deleteInvoice
);

// ============================================================================
// USER & ADMIN ROUTES (authenticated users)
// ============================================================================

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID (user can only see their own, admin sees all)
 * @access  Authenticated users
 */
router.get(
  '/invoices/:id',
  authenticate,
  InvoiceController.getInvoice
);

/**
 * @route   GET /api/invoices/user/:userId
 * @desc    Get all invoices for a specific user (user can only see their own, admin sees all)
 * @access  Authenticated users
 */
router.get(
  '/invoices/user/:userId',
  authenticate,
  InvoiceController.getUserInvoices
);

/**
 * @route   GET /api/invoices/:id/download
 * @desc    Download invoice PDF (user can only download their own, admin downloads all)
 * @access  Authenticated users
 */
router.get(
  '/invoices/:id/download',
  authenticate,
  InvoiceController.downloadInvoicePDF
);

export default router;
