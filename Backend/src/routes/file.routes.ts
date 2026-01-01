import { Router } from 'express';
import multer from 'multer';
import * as FileController from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/', // Temporary directory for uploaded files
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

const router = Router();

/**
 * File Routes
 * All routes require authentication
 */

/**
 * POST /api/files/orders/:orderId/upload
 * Upload file for order
 */
router.post(
  '/orders/:orderId/upload',
  authenticate,
  upload.single('file'),
  FileController.uploadOrderFile
);

/**
 * POST /api/files/quotes/:quoteId/upload
 * Upload file for quote
 */
router.post(
  '/quotes/:quoteId/upload',
  authenticate,
  upload.single('file'),
  FileController.uploadQuoteFile
);

/**
 * GET /api/files/orders/:orderId
 * Get files for order
 */
router.get('/orders/:orderId', authenticate, FileController.getOrderFiles);

/**
 * GET /api/files/quotes/:quoteId
 * Get files for quote
 */
router.get('/quotes/:quoteId', authenticate, FileController.getQuoteFiles);

/**
 * DELETE /api/files/:fileId
 * Delete file
 */
router.delete('/:fileId', authenticate, FileController.deleteFile);

/**
 * GET /api/files/my-files
 * Get user's uploaded files
 */
router.get('/my-files', authenticate, FileController.getMyFiles);

export default router;
