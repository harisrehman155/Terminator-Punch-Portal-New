import { Request, Response } from 'express';
import * as FileService from '../services/file.service';
import { successResponse, createdResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError } from '../utils/errors';
import archiver from 'archiver';
import fs from 'fs';

/**
 * File Controller - Handle file upload operations
 */

/**
 * Upload file for order
 * POST /api/files/orders/:orderId/upload
 */
export const uploadOrderFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orderId = parseInt(req.params.orderId);

  if (isNaN(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const fileRecord = await FileService.uploadOrderFile(
    req.file,
    orderId,
    req.user.userId,
    req.user.role
  );

  return createdResponse(res, 'File uploaded successfully for order', fileRecord);
});

/**
 * Upload file for quote
 * POST /api/files/quotes/:quoteId/upload
 */
export const uploadQuoteFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.quoteId);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
  }

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const fileRecord = await FileService.uploadQuoteFile(
    req.file,
    quoteId,
    req.user.userId,
    req.user.role
  );

  return createdResponse(res, 'File uploaded successfully for quote', fileRecord);
});

/**
 * Get files for order
 * GET /api/files/orders/:orderId
 */
export const getOrderFiles = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const orderId = parseInt(req.params.orderId);

  if (isNaN(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const files = await FileService.getOrderFiles(
    orderId,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Order files retrieved successfully', files);
});

/**
 * Get files for quote
 * GET /api/files/quotes/:quoteId
 */
export const getQuoteFiles = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const quoteId = parseInt(req.params.quoteId);

  if (isNaN(quoteId)) {
    throw new ValidationError('Invalid quote ID');
  }

  const files = await FileService.getQuoteFiles(
    quoteId,
    req.user.userId,
    req.user.role
  );

  return successResponse(res, 'Quote files retrieved successfully', files);
});

/**
 * Delete file
 * DELETE /api/files/:fileId
 */
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const fileId = parseInt(req.params.fileId);

  if (isNaN(fileId)) {
    throw new ValidationError('Invalid file ID');
  }

  await FileService.deleteFile(fileId, req.user.userId, req.user.role);

  return successResponse(res, 'File deleted successfully');
});

/**
 * Get user's uploaded files
 * GET /api/files/my-files
 */
export const getMyFiles = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const files = await FileService.getUserFiles(req.user.userId);

  return successResponse(res, 'Your files retrieved successfully', files);
});

/**
 * Download file by ID
 * GET /api/files/:fileId/download
 */
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const fileId = parseInt(req.params.fileId);

  if (isNaN(fileId)) {
    throw new ValidationError('Invalid file ID');
  }

  const file = await FileService.getFileForDownload(
    fileId,
    req.user.userId,
    req.user.role
  );

  return res.download(file.file_path, file.original_name);
});

/**
 * Download all order files as a zip
 * GET /api/files/orders/:orderId/download-all
 */
export const downloadOrderFilesZip = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      throw new ValidationError('Invalid order ID');
    }

    const files = await FileService.getOrderFiles(
      orderId,
      req.user.userId,
      req.user.role
    );

    const validFiles = files.filter((file) => file.file_path && fs.existsSync(file.file_path));

    if (validFiles.length === 0) {
      throw new ValidationError('No files available for download');
    }

    const zipName = `order-${orderId}-files.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    validFiles.forEach((file) => {
      const name = file.original_name || file.stored_name || `file-${file.id}`;
      archive.file(file.file_path, { name });
    });

    await archive.finalize();
  }
);
