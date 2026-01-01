import { Router } from 'express';
import * as LookupController from '../controllers/lookup.controller';

const router = Router();

/**
 * Lookup Routes
 * All routes are public (no authentication required)
 */

/**
 * GET /api/lookups
 * Get all lookup headers with their values
 * Returns structured data for all dropdowns
 */
router.get('/', LookupController.getAllLookups);

/**
 * GET /api/lookups/headers
 * Get all lookup headers (without values)
 */
router.get('/headers', LookupController.getAllHeaders);

/**
 * GET /api/lookups/headers/:id
 * Get lookup header by ID
 */
router.get('/headers/:id', LookupController.getHeaderById);

/**
 * GET /api/lookups/type/:type
 * Get lookups by type (e.g., placement, format, fabric)
 * Example: /api/lookups/type/placement
 */
router.get('/type/:type', LookupController.getLookupsByType);

/**
 * GET /api/lookups/header/:headerId
 * Get all lookups for a specific header ID
 */
router.get('/header/:headerId', LookupController.getLookupsByHeaderId);

/**
 * GET /api/lookups/search?q=searchTerm
 * Search lookups by value
 */
router.get('/search', LookupController.searchLookups);

/**
 * GET /api/lookups/:id
 * Get lookup by ID (with header info)
 * Note: This should be last to avoid conflicts with other routes
 */
router.get('/:id', LookupController.getLookupById);

export default router;
