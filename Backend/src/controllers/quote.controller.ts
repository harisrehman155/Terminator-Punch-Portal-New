import { Request, Response } from 'express';
import * as QuoteService from '../services/quote.service';
import { successResponse, createdResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError } from '../utils/errors';
import { QuoteCreateInput, QuoteUpdateInput, QuotePricingInput } from '../types/quote.types';

/**
 * Quote Controller - Handle HTTP requests for quotes
 */

/**
 * Create new quote
 * POST /api/quotes
 */
export const createQuote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const {
    quote_type,
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

  if (!quote_type || !['DIGITIZING', 'VECTOR', 'PATCHES'].includes(quote_type)) {
    errors.quote_type = 'Valid quote type is required (DIGITIZING, VECTOR, PATCHES)';
  }

  if (!design_name || design_name.trim().length === 0) {
    errors.design_name = 'Design name is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const quoteData: QuoteCreateInput = {
    quote_type,
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

  const quote = await QuoteService.createQuote(req.user.userId, quoteData);

  return createdResponse(res, 'Quote created successfully', quote);
});

/**
 * Get all quotes with filters
 * GET /api/quotes
 */
export const getQuotes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const filters: any = {
    service_type: req.query.service_type as any,
    status: req.query.status as any,
    is_urgent: req.query.is_urgent ? parseInt(req.query.is_urgent as string) : undefined,
    search: req.query.search as string,
    from_date: req.query.from_date as string,
    to_date: req.query.to_date as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const result = await QuoteService.getQuotes(
    filters,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Quotes retrieved successfully', result);
});

/**
 * Get current user's quotes
 * GET /api/quotes/my-quotes
 */
export const getMyQuotes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quotes = await QuoteService.getUserQuotes(req.user.userId);

  return successResponse(res, 'Your quotes retrieved successfully', quotes);
});

/**
 * Get quote by ID
 * GET /api/quotes/:id
 */
export const getQuoteById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.id);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
  }

  const quote = await QuoteService.getQuoteById(
    quoteId,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Quote retrieved successfully', quote);
});

/**
 * Get quote by quote number
 * GET /api/quotes/number/:quoteNo
 */
export const getQuoteByQuoteNo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { quoteNo } = req.params;

    if (!quoteNo || quoteNo.trim().length === 0) {
      throw new ValidationError('Quote number is required');
    }

    const quote = await QuoteService.getQuoteByQuoteNo(
      quoteNo,
      req.user.userId,
      req.user.role
    );

    return successResponse(res, 'Quote retrieved successfully', quote);
  }
);

/**
 * Update quote
 * PUT /api/quotes/:id
 */
export const updateQuote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.id);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
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
  } = req.body;

  const updateData: QuoteUpdateInput = {
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
    is_urgent: is_urgent ? 1 : 0,
  };

  const quote = await QuoteService.updateQuote(
    quoteId,
    updateData,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Quote updated successfully', quote);
});

/**
 * Update quote pricing (Admin only)
 * PATCH /api/quotes/:id/pricing
 */
export const updateQuotePricing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.id);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
  }

  const { price, currency, remarks } = req.body;

  // Validation
  const errors: any = {};

  if (price === undefined || price === null || price < 0) {
    errors.price = 'Valid price is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const pricingData: QuotePricingInput = {
    price: parseFloat(price),
    currency: currency || 'USD',
    remarks: remarks || null,
  };

  const quote = await QuoteService.updateQuotePricing(
    quoteId,
    pricingData,
    req.user.role
  );

  return successResponse(res, 'Quote pricing updated successfully', quote);
});

/**
 * Convert quote to order
 * POST /api/quotes/:id/convert
 */
export const convertQuoteToOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.id);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
  }

  const result = await QuoteService.convertQuoteToOrder(
    quoteId,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Quote converted to order successfully', result);
});

/**
 * Delete quote (Admin only)
 * DELETE /api/quotes/:id
 */
export const deleteQuote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.id);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
  }

  await QuoteService.deleteQuote(quoteId, req.user.role);

  return successResponse(res, 'Quote deleted successfully');
});
