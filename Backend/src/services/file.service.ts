import * as FileModel from '../models/file.model';
import * as OrderModel from '../models/order.model';
import * as QuoteModel from '../models/quote.model';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import fs from 'fs';
import path from 'path';

/**
 * File Service - Business logic for file uploads
 */

// Allowed file types and size limits
const ALLOWED_MIME_TYPES = [
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Validate file upload
 */
export const validateFile = (file: Express.Multer.File): void => {
  if (!file) {
    throw new ValidationError('No file provided');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `File type ${file.mimetype} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
  }
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);
  return `${basename}_${timestamp}_${random}${extension}`;
};

/**
 * Upload file for order
 */
export const uploadOrderFile = async (
  file: Express.Multer.File,
  orderId: number,
  userId: number,
  userRole: string
): Promise<any> => {
  // Validate file
  validateFile(file);

  // Check if order exists and user has permission
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only upload to their own orders, admins can upload to any
  if (userRole !== 'ADMIN' && order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to upload files to this order');
  }

  // Generate unique filename and move file
  const uniqueFilename = generateUniqueFilename(file.originalname);
  const orderDir = path.join(UPLOAD_DIR, 'orders', orderId.toString());

  // Ensure directory exists
  if (!fs.existsSync(orderDir)) {
    fs.mkdirSync(orderDir, { recursive: true });
  }

  const filePath = path.join(orderDir, uniqueFilename);

  // Move file to destination
  fs.renameSync(file.path, filePath);

  // Create file record in database
  const fileRecord = await FileModel.create({
    filename: uniqueFilename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    path: filePath,
    entity_type: 'order',
    entity_id: orderId,
    uploaded_by: userId,
  });

  return FileModel.toFileResponse(fileRecord);
};

/**
 * Upload file for quote
 */
export const uploadQuoteFile = async (
  file: Express.Multer.File,
  quoteId: number,
  userId: number,
  userRole: string
): Promise<any> => {
  // Validate file
  validateFile(file);

  // Check if quote exists and user has permission
  const quote = await QuoteModel.findById(quoteId);
  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only upload to their own quotes, admins can upload to any
  if (userRole !== 'ADMIN' && quote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to upload files to this quote');
  }

  // Generate unique filename and move file
  const uniqueFilename = generateUniqueFilename(file.originalname);
  const quoteDir = path.join(UPLOAD_DIR, 'quotes', quoteId.toString());

  // Ensure directory exists
  if (!fs.existsSync(quoteDir)) {
    fs.mkdirSync(quoteDir, { recursive: true });
  }

  const filePath = path.join(quoteDir, uniqueFilename);

  // Move file to destination
  fs.renameSync(file.path, filePath);

  // Create file record in database
  const fileRecord = await FileModel.create({
    filename: uniqueFilename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    path: filePath,
    entity_type: 'quote',
    entity_id: quoteId,
    uploaded_by: userId,
  });

  return FileModel.toFileResponse(fileRecord);
};

/**
 * Get files for order
 */
export const getOrderFiles = async (
  orderId: number,
  userId: number,
  userRole: string
): Promise<any[]> => {
  // Check if order exists and user has permission
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only view their own order files, admins can view any
  if (userRole !== 'ADMIN' && order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view files for this order');
  }

  const files = await FileModel.findByEntity('order', orderId);
  return files.map(FileModel.toFileResponse);
};

/**
 * Get files for quote
 */
export const getQuoteFiles = async (
  quoteId: number,
  userId: number,
  userRole: string
): Promise<any[]> => {
  // Check if quote exists and user has permission
  const quote = await QuoteModel.findById(quoteId);
  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only view their own quote files, admins can view any
  if (userRole !== 'ADMIN' && quote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view files for this quote');
  }

  const files = await FileModel.findByEntity('quote', quoteId);
  return files.map(FileModel.toFileResponse);
};

/**
 * Delete file
 */
export const deleteFile = async (
  fileId: number,
  userId: number,
  userRole: string
): Promise<void> => {
  // Get file record
  const file = await FileModel.findById(fileId);
  if (!file) {
    throw new NotFoundError('File not found');
  }

  // Authorization: Users can only delete their own uploaded files, admins can delete any
  if (userRole !== 'ADMIN' && file.uploaded_by !== userId) {
    throw new ForbiddenError('You do not have permission to delete this file');
  }

  // Delete physical file
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // Delete database record
  await FileModel.deleteById(fileId);
};

/**
 * Get user's uploaded files
 */
export const getUserFiles = async (userId: number): Promise<any[]> => {
  const files = await FileModel.findByUser(userId);
  return files.map(FileModel.toFileResponse);
};
