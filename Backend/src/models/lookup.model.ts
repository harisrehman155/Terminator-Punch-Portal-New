import { query, queryOne } from '../config/database';
import { DatabaseError } from '../utils/errors';

/**
 * Lookup Model - Database operations for lookups
 */

export interface LookupHeader {
  id: number;
  type: string;
  name: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface Lookup {
  id: number;
  header_id: number;
  value: string;
  display_order: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface LookupWithHeader extends Lookup {
  header_type: string;
  header_name: string;
}

export interface LookupHeaderWithValues extends LookupHeader {
  values: Lookup[];
}

/**
 * Get all lookup headers
 */
export const getAllHeaders = async (): Promise<LookupHeader[]> => {
  try {
    const headers = await query<LookupHeader[]>(
      'SELECT * FROM lookup_header WHERE is_active = 1 ORDER BY name'
    );
    return headers;
  } catch (error) {
    throw new DatabaseError('Failed to fetch lookup headers');
  }
};

/**
 * Get lookup header by ID
 */
export const getHeaderById = async (
  headerId: number
): Promise<LookupHeader | null> => {
  try {
    const header = await queryOne<LookupHeader>(
      'SELECT * FROM lookup_header WHERE id = ? AND is_active = 1',
      [headerId]
    );
    return header;
  } catch (error) {
    throw new DatabaseError('Failed to fetch lookup header');
  }
};

/**
 * Get lookup header by type
 */
export const getHeaderByType = async (
  type: string
): Promise<LookupHeader | null> => {
  try {
    const header = await queryOne<LookupHeader>(
      'SELECT * FROM lookup_header WHERE type = ? AND is_active = 1',
      [type]
    );
    return header;
  } catch (error) {
    throw new DatabaseError('Failed to fetch lookup header by type');
  }
};

/**
 * Get lookups by header ID
 */
export const getLookupsByHeaderId = async (
  headerId: number
): Promise<Lookup[]> => {
  try {
    const lookups = await query<Lookup[]>(
      'SELECT * FROM lookups WHERE header_id = ? AND is_active = 1 ORDER BY display_order, value',
      [headerId]
    );
    return lookups;
  } catch (error) {
    throw new DatabaseError('Failed to fetch lookups by header ID');
  }
};

/**
 * Get lookups by type (e.g., 'placement', 'format')
 */
export const getLookupsByType = async (type: string): Promise<Lookup[]> => {
  try {
    const lookups = await query<Lookup[]>(
      `SELECT l.* FROM lookups l
       INNER JOIN lookup_header lh ON l.header_id = lh.id
       WHERE lh.type = ? AND l.is_active = 1 AND lh.is_active = 1
       ORDER BY l.display_order, l.value`,
      [type]
    );
    return lookups;
  } catch (error) {
    throw new DatabaseError(`Failed to fetch lookups for type: ${type}`);
  }
};

/**
 * Get all lookup headers with their values
 */
export const getAllHeadersWithValues =
  async (): Promise<LookupHeaderWithValues[]> => {
    try {
      const headers = await getAllHeaders();

      const headersWithValues: LookupHeaderWithValues[] = [];

      for (const header of headers) {
        const values = await getLookupsByHeaderId(header.id);
        headersWithValues.push({
          ...header,
          values,
        });
      }

      return headersWithValues;
    } catch (error) {
      throw new DatabaseError('Failed to fetch lookup headers with values');
    }
  };

/**
 * Get lookup by ID
 */
export const getLookupById = async (
  lookupId: number
): Promise<Lookup | null> => {
  try {
    const lookup = await queryOne<Lookup>(
      'SELECT * FROM lookups WHERE id = ? AND is_active = 1',
      [lookupId]
    );
    return lookup;
  } catch (error) {
    throw new DatabaseError('Failed to fetch lookup by ID');
  }
};

/**
 * Get lookup with header info
 */
export const getLookupWithHeader = async (
  lookupId: number
): Promise<LookupWithHeader | null> => {
  try {
    const lookup = await queryOne<LookupWithHeader>(
      `SELECT l.*, lh.type as header_type, lh.name as header_name
       FROM lookups l
       INNER JOIN lookup_header lh ON l.header_id = lh.id
       WHERE l.id = ? AND l.is_active = 1 AND lh.is_active = 1`,
      [lookupId]
    );
    return lookup;
  } catch (error) {
    throw new DatabaseError('Failed to fetch lookup with header');
  }
};

/**
 * Search lookups by value
 */
export const searchLookups = async (
  searchTerm: string
): Promise<LookupWithHeader[]> => {
  try {
    const lookups = await query<LookupWithHeader[]>(
      `SELECT l.*, lh.type as header_type, lh.name as header_name
       FROM lookups l
       INNER JOIN lookup_header lh ON l.header_id = lh.id
       WHERE l.value LIKE ? AND l.is_active = 1 AND lh.is_active = 1
       ORDER BY lh.name, l.display_order, l.value`,
      [`%${searchTerm}%`]
    );
    return lookups;
  } catch (error) {
    throw new DatabaseError('Failed to search lookups');
  }
};
