/**
 * Lookup Helper Utility
 *
 * Provides functions to convert between enum string values and lookup IDs,
 * with built-in caching for performance optimization.
 *
 * Usage:
 *   - getLookupId('service_type', 'DIGITIZING') -> Returns the lookup ID
 *   - getLookupValue(123) -> Returns the lookup string value
 *   - getLookupValues('service_type') -> Returns all values for a type
 *   - LookupCache.clearCache() -> Clears the entire cache
 */

import { db } from '../database/connection';
import { RowDataPacket } from 'mysql2';

// ==============================================================================
// TYPES AND INTERFACES
// ==============================================================================

export interface LookupValue {
  id: number;
  lookup_header_id: number;
  lookup_value: string;
  display_order: number;
  is_active: boolean;
}

export interface LookupHeader {
  id: number;
  lookup_type: string;
  description?: string;
  is_active: boolean;
}

export interface CachedLookup {
  id: number;
  value: string;
  type: string;
  display_order: number;
}

// ==============================================================================
// IN-MEMORY CACHE
// ==============================================================================

class LookupCacheManager {
  private cache: Map<string, CachedLookup[]> = new Map();
  private idToValueCache: Map<number, CachedLookup> = new Map();
  private lastRefresh: Date | null = null;
  private readonly TTL_MINUTES = 60; // Cache expires after 60 minutes

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.lastRefresh) return false;
    const now = new Date();
    const diffMinutes = (now.getTime() - this.lastRefresh.getTime()) / (1000 * 60);
    return diffMinutes < this.TTL_MINUTES;
  }

  /**
   * Load all lookup values into cache
   */
  async initialize(): Promise<void> {
    try {
      const query = `
        SELECT
          l.id,
          l.lookup_value as value,
          lh.lookup_type as type,
          l.display_order,
          l.is_active
        FROM lookups l
        INNER JOIN lookup_header lh ON l.lookup_header_id = lh.id
        WHERE l.is_active = 1 AND lh.is_active = 1
        ORDER BY lh.lookup_type, l.display_order
      `;

      const [rows] = await db.query<RowDataPacket[]>(query);

      // Clear existing caches
      this.cache.clear();
      this.idToValueCache.clear();

      // Populate caches
      for (const row of rows) {
        const cached: CachedLookup = {
          id: row.id,
          value: row.value,
          type: row.type,
          display_order: row.display_order,
        };

        // Add to type-based cache
        if (!this.cache.has(row.type)) {
          this.cache.set(row.type, []);
        }
        this.cache.get(row.type)!.push(cached);

        // Add to ID-based cache
        this.idToValueCache.set(row.id, cached);
      }

      this.lastRefresh = new Date();
      console.log(`[LookupCache] Initialized with ${rows.length} lookup values`);
    } catch (error) {
      console.error('[LookupCache] Failed to initialize:', error);
      throw new Error('Failed to initialize lookup cache');
    }
  }

  /**
   * Get cached lookups by type
   */
  async getByType(type: string): Promise<CachedLookup[]> {
    if (!this.isCacheValid()) {
      await this.initialize();
    }
    return this.cache.get(type) || [];
  }

  /**
   * Get cached lookup by ID
   */
  async getById(id: number): Promise<CachedLookup | undefined> {
    if (!this.isCacheValid()) {
      await this.initialize();
    }
    return this.idToValueCache.get(id);
  }

  /**
   * Find lookup ID by type and value
   */
  async findId(type: string, value: string): Promise<number | null> {
    const lookups = await this.getByType(type);
    const found = lookups.find((l) => l.value === value);
    return found ? found.id : null;
  }

  /**
   * Clear the entire cache (force refresh on next access)
   */
  clearCache(): void {
    this.cache.clear();
    this.idToValueCache.clear();
    this.lastRefresh = null;
    console.log('[LookupCache] Cache cleared');
  }

  /**
   * Manually refresh the cache
   */
  async refresh(): Promise<void> {
    await this.initialize();
  }
}

// Export singleton instance
export const LookupCache = new LookupCacheManager();

// ==============================================================================
// PUBLIC API FUNCTIONS
// ==============================================================================

/**
 * Get lookup ID by type and value
 *
 * @param type - The lookup type (e.g., 'service_type', 'order_status')
 * @param value - The lookup value (e.g., 'DIGITIZING', 'PENDING')
 * @returns The lookup ID, or null if not found
 *
 * @example
 * const id = await getLookupId('service_type', 'DIGITIZING');
 * // Returns: 1
 */
export async function getLookupId(
  type: string,
  value: string
): Promise<number | null> {
  try {
    // Try cache first
    const cachedId = await LookupCache.findId(type, value);
    if (cachedId !== null) {
      return cachedId;
    }

    // If not in cache, query database (and refresh cache)
    console.warn(
      `[LookupHelper] Cache miss for ${type}:${value}, querying database`
    );

    const query = `
      SELECT l.id
      FROM lookups l
      INNER JOIN lookup_header lh ON l.lookup_header_id = lh.id
      WHERE lh.lookup_type = ? AND l.lookup_value = ? AND l.is_active = 1 AND lh.is_active = 1
      LIMIT 1
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [type, value]);

    if (rows.length === 0) {
      console.error(`[LookupHelper] Lookup not found: ${type}:${value}`);
      return null;
    }

    // Refresh cache for next time
    await LookupCache.refresh();

    return rows[0].id;
  } catch (error) {
    console.error(`[LookupHelper] Error getting lookup ID for ${type}:${value}:`, error);
    throw error;
  }
}

/**
 * Get lookup value by ID
 *
 * @param id - The lookup ID
 * @returns The lookup value string, or null if not found
 *
 * @example
 * const value = await getLookupValue(1);
 * // Returns: 'DIGITIZING'
 */
export async function getLookupValue(id: number): Promise<string | null> {
  try {
    // Try cache first
    const cached = await LookupCache.getById(id);
    if (cached) {
      return cached.value;
    }

    // If not in cache, query database
    console.warn(`[LookupHelper] Cache miss for ID ${id}, querying database`);

    const query = 'SELECT lookup_value FROM lookups WHERE id = ? AND is_active = 1 LIMIT 1';
    const [rows] = await db.query<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      console.error(`[LookupHelper] Lookup ID not found: ${id}`);
      return null;
    }

    // Refresh cache for next time
    await LookupCache.refresh();

    return rows[0].lookup_value;
  } catch (error) {
    console.error(`[LookupHelper] Error getting lookup value for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get all lookup values for a specific type
 *
 * @param type - The lookup type (e.g., 'service_type', 'order_status')
 * @returns Array of lookup values with IDs and display order
 *
 * @example
 * const serviceTypes = await getLookupValues('service_type');
 * // Returns: [
 * //   { id: 1, value: 'DIGITIZING', display_order: 1 },
 * //   { id: 2, value: 'VECTOR', display_order: 2 },
 * //   { id: 3, value: 'PATCHES', display_order: 3 }
 * // ]
 */
export async function getLookupValues(
  type: string
): Promise<Array<{ id: number; value: string; display_order: number }>> {
  try {
    // Try cache first
    const cached = await LookupCache.getByType(type);
    if (cached.length > 0) {
      return cached.map((c) => ({
        id: c.id,
        value: c.value,
        display_order: c.display_order,
      }));
    }

    // If not in cache, query database
    console.warn(`[LookupHelper] Cache miss for type ${type}, querying database`);

    const query = `
      SELECT
        l.id,
        l.lookup_value as value,
        l.display_order
      FROM lookups l
      INNER JOIN lookup_header lh ON l.lookup_header_id = lh.id
      WHERE lh.lookup_type = ? AND l.is_active = 1 AND lh.is_active = 1
      ORDER BY l.display_order
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [type]);

    // Refresh cache for next time
    await LookupCache.refresh();

    return rows.map((row) => ({
      id: row.id,
      value: row.value,
      display_order: row.display_order,
    }));
  } catch (error) {
    console.error(`[LookupHelper] Error getting lookup values for type ${type}:`, error);
    throw error;
  }
}

/**
 * Convert multiple enum values to lookup IDs in one call
 *
 * @param type - The lookup type
 * @param values - Array of enum values
 * @returns Array of lookup IDs (preserves order, null for not found)
 *
 * @example
 * const ids = await getLookupIds('service_type', ['DIGITIZING', 'VECTOR']);
 * // Returns: [1, 2]
 */
export async function getLookupIds(
  type: string,
  values: string[]
): Promise<(number | null)[]> {
  const promises = values.map((value) => getLookupId(type, value));
  return Promise.all(promises);
}

/**
 * Validate that a lookup value exists
 *
 * @param type - The lookup type
 * @param value - The value to validate
 * @returns True if the lookup exists and is active
 *
 * @example
 * const isValid = await isValidLookup('service_type', 'DIGITIZING');
 * // Returns: true
 */
export async function isValidLookup(type: string, value: string): Promise<boolean> {
  const id = await getLookupId(type, value);
  return id !== null;
}

/**
 * Get all lookup types available in the system
 *
 * @returns Array of lookup type names
 *
 * @example
 * const types = await getLookupTypes();
 * // Returns: ['service_type', 'order_status', 'quote_status', ...]
 */
export async function getLookupTypes(): Promise<string[]> {
  try {
    const query = 'SELECT lookup_type FROM lookup_header WHERE is_active = 1 ORDER BY lookup_type';
    const [rows] = await db.query<RowDataPacket[]>(query);
    return rows.map((row) => row.lookup_type);
  } catch (error) {
    console.error('[LookupHelper] Error getting lookup types:', error);
    throw error;
  }
}

// ==============================================================================
// INITIALIZATION
// ==============================================================================

/**
 * Initialize the lookup cache on application startup
 * Call this from your app.ts or server.ts initialization
 */
export async function initializeLookupCache(): Promise<void> {
  console.log('[LookupHelper] Initializing lookup cache...');
  await LookupCache.initialize();
  console.log('[LookupHelper] Lookup cache ready');
}

// ==============================================================================
// EXPORT DEFAULT OBJECT (Alternative API)
// ==============================================================================

export default {
  getLookupId,
  getLookupValue,
  getLookupValues,
  getLookupIds,
  isValidLookup,
  getLookupTypes,
  initializeCache: initializeLookupCache,
  clearCache: () => LookupCache.clearCache(),
  refreshCache: () => LookupCache.refresh(),
};
