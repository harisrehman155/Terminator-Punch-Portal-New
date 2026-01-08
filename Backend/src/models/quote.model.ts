import { query, queryOne } from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { generateQuoteNumber } from '../utils/helpers';
import { getLookupId } from '../utils/lookup.helper';
import {
  Quote,
  QuoteCreateInput,
  QuoteUpdateInput,
  QuotePricingInput,
  QuoteWithUser,
  QuoteResponse,
} from '../types/quote.types';

const resolveLookupId = async (
  primaryType: string,
  fallbackType: string | null,
  value: string
): Promise<number | null> => {
  const primary = await getLookupId(primaryType, value);
  if (primary !== null) {
    return primary;
  }
  if (!fallbackType) {
    return null;
  }
  return getLookupId(fallbackType, value);
};

/**
 * Quote Model - Database operations for quotes
 */

/**
 * Create a new quote
 */
export const create = async (
  userId: number,
  quoteData: QuoteCreateInput
): Promise<Quote> => {
  try {
    // Generate unique quote number
    const quoteNo = generateQuoteNumber();

    // Get lookup IDs for service_type, status, and unit
    const serviceTypeId = await resolveLookupId(
      'service_type',
      'order_type',
      quoteData.quote_type
    );
    if (!serviceTypeId) {
      throw new DatabaseError('Invalid quote type');
    }

    const statusId = await resolveLookupId('quote_status', 'order_status', 'PENDING');
    if (!statusId) {
      throw new DatabaseError('PENDING status not found in lookup table');
    }

    // Get unit_id if unit is provided
    let unitId: number | null = null;
    if (quoteData.unit) {
      unitId = await resolveLookupId(
        'measurement_unit',
        'unit',
        quoteData.unit
      );
    }

    // Prepare JSON fields
    const placement = quoteData.placement
      ? JSON.stringify(quoteData.placement)
      : null;
    const requiredFormat = quoteData.required_format
      ? JSON.stringify(quoteData.required_format)
      : null;

    const result: any = await query(
      `INSERT INTO quotes (
        user_id, quote_no, service_type_id, status_id, design_name,
        height, width, unit_id, number_of_colors, fabric, color_type,
        placement, required_format, instruction, is_urgent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        quoteNo,
        serviceTypeId,
        statusId,
        quoteData.design_name,
        quoteData.height || null,
        quoteData.width || null,
        unitId,
        quoteData.number_of_colors || null,
        quoteData.fabric || null,
        quoteData.color_type || null,
        placement,
        requiredFormat,
        quoteData.instruction || null,
        quoteData.is_urgent || 0,
      ]
    );

    const quoteId = result.insertId;
    const quote = await findById(quoteId);

    if (!quote) {
      throw new DatabaseError('Failed to retrieve created quote');
    }

    return quote;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('Quote number already exists');
    }
    throw new DatabaseError('Failed to create quote');
  }
};

/**
 * Find quote by ID
 */
export const findById = async (quoteId: number): Promise<Quote | null> => {
  try {
    const quote = await queryOne<any>(
      `SELECT
        q.*,
        st.lookup_value as service_type,
        s.lookup_value as status,
        u.lookup_value as unit
      FROM quotes q
      LEFT JOIN lookups st ON q.service_type_id = st.id
      LEFT JOIN lookups s ON q.status_id = s.id
      LEFT JOIN lookups u ON q.unit_id = u.id
      WHERE q.id = ?`,
      [quoteId]
    );

    if (!quote) {
      return null;
    }

    return parseQuoteFromDB(quote);
  } catch (error) {
    throw new DatabaseError('Failed to find quote');
  }
};

/**
 * Find quote by quote number
 */
export const findByQuoteNo = async (
  quoteNo: string
): Promise<Quote | null> => {
  try {
    const quote = await queryOne<any>(
      `SELECT
        q.*,
        st.lookup_value as service_type,
        s.lookup_value as status,
        u.lookup_value as unit
      FROM quotes q
      LEFT JOIN lookups st ON q.service_type_id = st.id
      LEFT JOIN lookups s ON q.status_id = s.id
      LEFT JOIN lookups u ON q.unit_id = u.id
      WHERE q.quote_no = ?`,
      [quoteNo]
    );

    if (!quote) {
      return null;
    }

    return parseQuoteFromDB(quote);
  } catch (error) {
    throw new DatabaseError('Failed to find quote by quote number');
  }
};

/**
 * Find quotes by user ID
 */
export const findByUserId = async (userId: number): Promise<Quote[]> => {
  try {
    const quotes = await query<any[]>(
      `SELECT
        q.*,
        st.lookup_value as service_type,
        s.lookup_value as status,
        u.lookup_value as unit
      FROM quotes q
      LEFT JOIN lookups st ON q.service_type_id = st.id
      LEFT JOIN lookups s ON q.status_id = s.id
      LEFT JOIN lookups u ON q.unit_id = u.id
      WHERE q.user_id = ? ORDER BY q.created_at DESC`,
      [userId]
    );

    return quotes.map(parseQuoteFromDB);
  } catch (error) {
    throw new DatabaseError('Failed to find quotes by user ID');
  }
};

/**
 * Find quote with user info
 */
export const findByIdWithUser = async (
  quoteId: number
): Promise<QuoteWithUser | null> => {
  try {
    const quote = await queryOne<any>(
      `SELECT
        q.*,
        st.lookup_value as service_type,
        s.lookup_value as status,
        u.lookup_value as unit,
        usr.name as user_name,
        usr.email as user_email,
        usr.company as user_company
      FROM quotes q
      LEFT JOIN lookups st ON q.service_type_id = st.id
      LEFT JOIN lookups s ON q.status_id = s.id
      LEFT JOIN lookups u ON q.unit_id = u.id
      INNER JOIN users usr ON q.user_id = usr.id
      WHERE q.id = ?`,
      [quoteId]
    );

    if (!quote) {
      return null;
    }

    return parseQuoteWithUserFromDB(quote);
  } catch (error) {
    throw new DatabaseError('Failed to find quote with user');
  }
};

/**
 * Get all quotes with optional filters
 */
export const findAll = async (filters: any = {}): Promise<Quote[]> => {
  try {
    let sql = `SELECT
      q.*,
      st.lookup_value as service_type,
      s.lookup_value as status,
      u.lookup_value as unit
    FROM quotes q
    LEFT JOIN lookups st ON q.service_type_id = st.id
    LEFT JOIN lookups s ON q.status_id = s.id
    LEFT JOIN lookups u ON q.unit_id = u.id
    WHERE 1=1`;
    const params: any[] = [];

    // Apply filters
    if (filters.user_id) {
      sql += ' AND q.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.service_type) {
      sql += ' AND st.lookup_value = ?';
      params.push(filters.service_type);
    }

    if (filters.status) {
      sql += ' AND s.lookup_value = ?';
      params.push(filters.status);
    }

    if (filters.is_urgent !== undefined) {
      sql += ' AND q.is_urgent = ?';
      params.push(filters.is_urgent);
    }

    if (filters.search) {
      sql += ' AND (q.quote_no LIKE ? OR q.design_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.from_date) {
      sql += ' AND q.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND q.created_at <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY q.created_at DESC';

    const quotes = await query<any[]>(sql, params);
    return quotes.map(parseQuoteFromDB);
  } catch (error) {
    throw new DatabaseError('Failed to retrieve quotes');
  }
};

/**
 * Update quote
 */
export const update = async (
  quoteId: number,
  updateData: QuoteUpdateInput
): Promise<Quote> => {
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
        ? await resolveLookupId('measurement_unit', 'unit', updateData.unit)
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
      const placement = updateData.placement
        ? JSON.stringify(updateData.placement)
        : null;
      updates.push('placement = ?');
      params.push(placement);
    }

    if (updateData.required_format !== undefined) {
      const requiredFormat = updateData.required_format
        ? JSON.stringify(updateData.required_format)
        : null;
      updates.push('required_format = ?');
      params.push(requiredFormat);
    }

    if (updateData.instruction !== undefined) {
      updates.push('instruction = ?');
      params.push(updateData.instruction);
    }

    if (updateData.is_urgent !== undefined) {
      updates.push('is_urgent = ?');
      params.push(updateData.is_urgent);
    }

    if (updates.length === 0) {
      const quote = await findById(quoteId);
      if (!quote) throw new NotFoundError('Quote not found');
      return quote;
    }

    params.push(quoteId);

    await query(
      `UPDATE quotes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    const quote = await findById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found');
    }

    return quote;
  } catch (error) {
    throw new DatabaseError('Failed to update quote');
  }
};

/**
 * Update quote pricing (admin only)
 */
export const updatePricing = async (
  quoteId: number,
  pricingData: QuotePricingInput
): Promise<Quote> => {
  try {
    await query(
      'UPDATE quotes SET price = ?, currency = ?, remarks = ?, updated_at = NOW() WHERE id = ?',
      [pricingData.price, pricingData.currency || 'USD', pricingData.remarks || null, quoteId]
    );

    // Update status to PRICED
    const pricedStatusId = await resolveLookupId('quote_status', 'order_status', 'PRICED');
    if (pricedStatusId) {
      await query(
        'UPDATE quotes SET status_id = ? WHERE id = ?',
        [pricedStatusId, quoteId]
      );
    }

    const quote = await findById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found');
    }

    return quote;
  } catch (error) {
    throw new DatabaseError('Failed to update quote pricing');
  }
};

/**
 * Convert quote to order
 */
export const convertToOrder = async (
  quoteId: number,
  orderId: number
): Promise<void> => {
  try {
    // Update quote status to CONVERTED and link to order
    const convertedStatusId = await resolveLookupId(
      'quote_status',
      'order_status',
      'CONVERTED'
    );
    if (convertedStatusId) {
      await query(
        'UPDATE quotes SET status_id = ?, converted_order_id = ?, updated_at = NOW() WHERE id = ?',
        [convertedStatusId, orderId, quoteId]
      );
    }
  } catch (error) {
    throw new DatabaseError('Failed to convert quote to order');
  }
};

/**
 * Delete quote
 */
export const deleteById = async (quoteId: number): Promise<void> => {
  try {
    await query('DELETE FROM quotes WHERE id = ?', [quoteId]);
  } catch (error) {
    throw new DatabaseError('Failed to delete quote');
  }
};

/**
 * Convert Quote to QuoteResponse (remove sensitive data)
 */
export const toQuoteResponse = (quote: Quote): QuoteResponse => {
  return {
    id: quote.id,
    quote_no: quote.quote_no,
    service_type: quote.service_type,
    status: quote.status,
    design_name: quote.design_name,
    height: quote.height,
    width: quote.width,
    unit: quote.unit,
    number_of_colors: quote.number_of_colors,
    fabric: quote.fabric,
    color_type: quote.color_type,
    placement: quote.placement,
    required_format: quote.required_format,
    instruction: quote.instruction,
    is_urgent: quote.is_urgent,
    price: quote.price,
    currency: quote.currency,
    remarks: quote.remarks,
    converted_order_id: quote.converted_order_id,
    created_at: quote.created_at,
    updated_at: quote.updated_at,
  };
};

/**
 * Parse quote from database result
 */
const parseQuoteFromDB = (dbQuote: any): Quote => {
  return {
    ...dbQuote,
    placement: dbQuote.placement ? JSON.parse(dbQuote.placement) : null,
    required_format: dbQuote.required_format
      ? JSON.parse(dbQuote.required_format)
      : null,
  };
};

/**
 * Parse quote with user from database result
 */
const parseQuoteWithUserFromDB = (dbQuote: any): QuoteWithUser => {
  return {
    ...parseQuoteFromDB(dbQuote),
    user_name: dbQuote.user_name,
    user_email: dbQuote.user_email,
    user_company: dbQuote.user_company,
  };
};
