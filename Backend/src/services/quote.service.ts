import * as QuoteModel from '../models/quote.model';
import * as OrderService from './order.service';
import * as OrderModel from '../models/order.model';
import {
  Quote,
  QuoteCreateInput,
  QuoteUpdateInput,
  QuotePricingInput,
  QuoteResponse,
} from '../types/quote.types';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';

/**
 * Quote Service - Business logic for quotes
 */

/**
 * Create a new quote
 */
export const createQuote = async (
  userId: number,
  quoteData: QuoteCreateInput
): Promise<QuoteResponse> => {
  // Validate quote type specific fields
  validateQuoteTypeFields(quoteData);

  const quote = await QuoteModel.create(userId, quoteData);

  return QuoteModel.toQuoteResponse(quote);
};

/**
 * Get quote by ID
 * Users can only view their own quotes, admins can view all
 */
export const getQuoteById = async (
  quoteId: number,
  userId: number,
  userRole: string
): Promise<QuoteResponse & { user?: any }> => {
  const quote = await QuoteModel.findByIdWithUser(quoteId);

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only view their own quotes
  if (userRole !== 'ADMIN' && quote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this quote');
  }

  return {
    ...QuoteModel.toQuoteResponse(quote),
    user: {
      id: quote.user_id,
      name: quote.user_name,
      email: quote.user_email,
      company: quote.user_company,
    },
  };
};

/**
 * Get quote by quote number
 */
export const getQuoteByQuoteNo = async (
  quoteNo: string,
  userId: number,
  userRole: string
): Promise<QuoteResponse> => {
  const quote = await QuoteModel.findByQuoteNo(quoteNo);

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only view their own quotes
  if (userRole !== 'ADMIN' && quote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this quote');
  }

  return QuoteModel.toQuoteResponse(quote);
};

/**
 * Get all quotes with filters
 * Users can only see their own quotes, admins can see all
 */
export const getQuotes = async (
  filters: any,
  userId: number,
  userRole: string
): Promise<{
  quotes: (QuoteResponse & { user?: any })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // If user is not admin, force filter to their own quotes
  if (userRole !== 'ADMIN') {
    filters.user_id = userId;
  }

  const quotes = await QuoteModel.findAll(filters);

  // Get total count (simplified - you might want to create a count method)
  const allQuotes = await QuoteModel.findAll(filters);
  const total = allQuotes.length;

  const limit = filters.limit || 10;
  const page = filters.offset ? Math.floor(filters.offset / limit) + 1 : 1;
  const totalPages = Math.ceil(total / limit);

  const quoteResponses: (QuoteResponse & { user?: any })[] = [];

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

  return {
    quotes: quoteResponses,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Get user's quotes
 */
export const getUserQuotes = async (
  userId: number
): Promise<QuoteResponse[]> => {
  const quotes = await QuoteModel.findByUserId(userId);

  return quotes.map((quote) => QuoteModel.toQuoteResponse(quote));
};

/**
 * Update quote
 * Users can only update their own quotes in PENDING status
 * Admins can update any quote
 */
export const updateQuote = async (
  quoteId: number,
  updateData: QuoteUpdateInput,
  userId: number,
  userRole: string
): Promise<QuoteResponse> => {
  const existingQuote = await QuoteModel.findById(quoteId);

  if (!existingQuote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only update their own quotes
  if (userRole !== 'ADMIN' && existingQuote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to update this quote');
  }

  // Users cannot update quotes that are not in PENDING status
  if (
    userRole !== 'ADMIN' &&
    existingQuote.status !== 'PENDING'
  ) {
    throw new ForbiddenError('Cannot update quotes that are not pending');
  }

  // Validate quote type specific fields
  if (updateData.quote_type || Object.keys(updateData).length > 1) {
    validateQuoteTypeFields({
      quote_type: existingQuote.service_type,
      ...updateData,
    } as any);
  }

  const updatedQuote = await QuoteModel.update(quoteId, updateData);

  return QuoteModel.toQuoteResponse(updatedQuote);
};

/**
 * Update quote pricing (Admin only)
 */
export const updateQuotePricing = async (
  quoteId: number,
  pricingData: QuotePricingInput,
  userRole: string
): Promise<QuoteResponse> => {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('Only admins can update quote pricing');
  }

  const existingQuote = await QuoteModel.findById(quoteId);

  if (!existingQuote) {
    throw new NotFoundError('Quote not found');
  }

  // Can only price PENDING quotes
  if (existingQuote.status !== 'PENDING') {
    throw new ValidationError('Can only price pending quotes');
  }

  const updatedQuote = await QuoteModel.updatePricing(quoteId, pricingData);

  return QuoteModel.toQuoteResponse(updatedQuote);
};

/**
 * Convert quote to order
 * Users can convert their own PRICED quotes to orders
 * Admins can convert any PRICED quote
 */
export const convertQuoteToOrder = async (
  quoteId: number,
  userId: number,
  userRole: string
): Promise<{ quote: QuoteResponse; order: any }> => {
  const existingQuote = await QuoteModel.findById(quoteId);

  if (!existingQuote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization
  if (userRole !== 'ADMIN' && existingQuote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to convert this quote');
  }

  // Can only convert PRICED quotes
  if (existingQuote.status !== 'PRICED') {
    throw new ValidationError('Can only convert priced quotes to orders');
  }

  // Create order from quote data
  const orderData = {
    order_type: existingQuote.service_type!,
    design_name: existingQuote.design_name,
    height: existingQuote.height,
    width: existingQuote.width,
    unit: existingQuote.unit,
    number_of_colors: existingQuote.number_of_colors,
    fabric: existingQuote.fabric,
    color_type: existingQuote.color_type,
    placement: existingQuote.placement,
    required_format: existingQuote.required_format,
    instruction: existingQuote.instruction,
    is_urgent: existingQuote.is_urgent,
  };

  const order = await OrderService.createOrder(existingQuote.user_id, orderData);

  // Update quote status to CONVERTED
  await QuoteModel.convertToOrder(quoteId, order.id);

  return {
    quote: QuoteModel.toQuoteResponse(await QuoteModel.findById(quoteId)!),
    order,
  };
};

/**
 * Delete quote (Admin only)
 */
export const deleteQuote = async (
  quoteId: number,
  userId: number,
  userRole: string
): Promise<void> => {
  const existingQuote = await QuoteModel.findById(quoteId);

  if (!existingQuote) {
    throw new NotFoundError('Quote not found');
  }

  if (userRole !== 'ADMIN') {
    if (existingQuote.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to delete this quote');
    }
  }

  // Cannot delete converted quotes
  if (existingQuote.converted_order_id) {
    throw new ValidationError('Cannot delete quotes that have been converted to orders');
  }

  await QuoteModel.deleteById(quoteId);
};

/**
 * Validate quote type specific fields
 */
const validateQuoteTypeFields = (quoteData: QuoteCreateInput | any): void => {
  const { quote_type, number_of_colors, fabric, color_type } = quoteData;

  // DIGITIZING and PATCHES require number_of_colors and fabric
  if (quote_type === 'DIGITIZING' || quote_type === 'PATCHES') {
    if (!number_of_colors) {
      throw new ValidationError(
        `Number of colors is required for ${quote_type} quotes`
      );
    }
    if (!fabric) {
      throw new ValidationError(`Fabric is required for ${quote_type} quotes`);
    }
  }

  // VECTOR requires color_type
  if (quote_type === 'VECTOR') {
    if (!color_type) {
      throw new ValidationError('Color type is required for VECTOR quotes');
    }
  }
};
