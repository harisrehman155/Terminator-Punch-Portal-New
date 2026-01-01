import { Request, Response } from 'express';
import * as LookupModel from '../models/lookup.model';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Lookup Controller - Handle HTTP requests for lookups
 */

/**
 * Get all lookup headers with their values
 * GET /api/lookups
 */
export const getAllLookups = asyncHandler(
  async (req: Request, res: Response) => {
    const lookups = await LookupModel.getAllHeadersWithValues();

    return successResponse(
      res,
      'Lookups retrieved successfully',
      lookups
    );
  }
);

/**
 * Get all lookup headers (without values)
 * GET /api/lookups/headers
 */
export const getAllHeaders = asyncHandler(
  async (req: Request, res: Response) => {
    const headers = await LookupModel.getAllHeaders();

    return successResponse(
      res,
      'Lookup headers retrieved successfully',
      headers
    );
  }
);

/**
 * Get lookup header by ID
 * GET /api/lookups/headers/:id
 */
export const getHeaderById = asyncHandler(
  async (req: Request, res: Response) => {
    const headerId = parseInt(req.params.id);

    if (isNaN(headerId)) {
      throw new ValidationError('Invalid header ID');
    }

    const header = await LookupModel.getHeaderById(headerId);

    if (!header) {
      throw new NotFoundError('Lookup header not found');
    }

    return successResponse(
      res,
      'Lookup header retrieved successfully',
      header
    );
  }
);

/**
 * Get lookups by type (e.g., placement, format, fabric)
 * GET /api/lookups/type/:type
 */
export const getLookupsByType = asyncHandler(
  async (req: Request, res: Response) => {
    const { type } = req.params;

    if (!type || type.trim().length === 0) {
      throw new ValidationError('Lookup type is required');
    }

    const lookups = await LookupModel.getLookupsByType(type.trim());

    return successResponse(
      res,
      `Lookups for type '${type}' retrieved successfully`,
      lookups
    );
  }
);

/**
 * Get lookups by header ID
 * GET /api/lookups/header/:headerId
 */
export const getLookupsByHeaderId = asyncHandler(
  async (req: Request, res: Response) => {
    const headerId = parseInt(req.params.headerId);

    if (isNaN(headerId)) {
      throw new ValidationError('Invalid header ID');
    }

    const header = await LookupModel.getHeaderById(headerId);
    if (!header) {
      throw new NotFoundError('Lookup header not found');
    }

    const lookups = await LookupModel.getLookupsByHeaderId(headerId);

    return successResponse(
      res,
      'Lookups retrieved successfully',
      lookups
    );
  }
);

/**
 * Get lookup by ID
 * GET /api/lookups/:id
 */
export const getLookupById = asyncHandler(
  async (req: Request, res: Response) => {
    const lookupId = parseInt(req.params.id);

    if (isNaN(lookupId)) {
      throw new ValidationError('Invalid lookup ID');
    }

    const lookup = await LookupModel.getLookupWithHeader(lookupId);

    if (!lookup) {
      throw new NotFoundError('Lookup not found');
    }

    return successResponse(
      res,
      'Lookup retrieved successfully',
      lookup
    );
  }
);

/**
 * Search lookups
 * GET /api/lookups/search?q=searchTerm
 */
export const searchLookups = asyncHandler(
  async (req: Request, res: Response) => {
    const searchTerm = req.query.q as string;

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }

    if (searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters');
    }

    const lookups = await LookupModel.searchLookups(searchTerm.trim());

    return successResponse(
      res,
      'Search results retrieved successfully',
      {
        searchTerm: searchTerm.trim(),
        count: lookups.length,
        results: lookups,
      }
    );
  }
);
