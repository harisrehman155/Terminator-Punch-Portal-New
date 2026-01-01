import { Router } from 'express';
import * as QuoteController from '../controllers/quote.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

/**
 * Quote Routes
 * All routes require authentication
 */

/**
 * POST /api/quotes
 * Create new quote (User & Admin)
 */
router.post('/', authenticate, QuoteController.createQuote);

/**
 * GET /api/quotes
 * Get all quotes with filters (User sees own, Admin sees all)
 */
router.get('/', authenticate, QuoteController.getQuotes);

/**
 * GET /api/quotes/my-quotes
 * Get current user's quotes
 */
router.get('/my-quotes', authenticate, QuoteController.getMyQuotes);

/**
 * GET /api/quotes/number/:quoteNo
 * Get quote by quote number
 * Note: This must be before /:id to avoid conflicts
 */
router.get('/number/:quoteNo', authenticate, QuoteController.getQuoteByQuoteNo);

/**
 * GET /api/quotes/:id
 * Get quote by ID
 */
router.get('/:id', authenticate, QuoteController.getQuoteById);

/**
 * PUT /api/quotes/:id
 * Update quote (User can update own, Admin can update all)
 */
router.put('/:id', authenticate, QuoteController.updateQuote);

/**
 * PATCH /api/quotes/:id/pricing
 * Update quote pricing (Admin only)
 */
router.patch(
  '/:id/pricing',
  authenticate,
  requireAdmin,
  QuoteController.updateQuotePricing
);

/**
 * POST /api/quotes/:id/convert
 * Convert quote to order (User can convert own, Admin can convert all)
 */
router.post('/:id/convert', authenticate, QuoteController.convertQuoteToOrder);

/**
 * DELETE /api/quotes/:id
 * Delete quote (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, QuoteController.deleteQuote);

export default router;
